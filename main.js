var d = require("obsidian");

class NewNoteInFolderPlugin extends d.Plugin {
  constructor() {
    super(...arguments);
    this.selectedFolder = null;
    this.origCreate = null;
  }

  async onload() {
    var plugin = this;

    // Add "New note here" when right-clicking a folder
    this.registerEvent(
      this.app.workspace.on("file-menu", function (menu, file) {
        if (!(file instanceof d.TFolder)) return;
        menu.addItem(function (item) {
          item.setTitle("New note here").setIcon("file-plus").onClick(function () {
            plugin.createNoteInFolder(file);
          });
        });
      })
    );

    // Click on a folder or file in file explorer to set target folder
    this.registerDomEvent(document, "click", function (evt) {
      // Don't clear if clicking action buttons (new note icon, etc.)
      if (evt.target.closest(".nav-action-button") || evt.target.closest(".clickable-icon")) return;

      // Check for folder click
      var navFolder = evt.target.closest(".nav-folder-title");
      if (navFolder) {
        var path = navFolder.getAttribute("data-path");
        if (path) {
          var folder = plugin.app.vault.getAbstractFileByPath(path);
          if (folder instanceof d.TFolder) {
            plugin.selectFolder(folder);
            return;
          }
        }
      }

      // Check for file click — use its parent folder
      var navFile = evt.target.closest(".nav-file-title");
      if (navFile) {
        var path = navFile.getAttribute("data-path");
        if (path) {
          var file = plugin.app.vault.getAbstractFileByPath(path);
          if (file instanceof d.TFile && file.parent) {
            plugin.selectFolder(file.parent);
            return;
          }
        }
      }

      // Clicked somewhere else — clear selection
      plugin.clearSelection();
    });

    // Command: new note in selected/current folder
    this.addCommand({
      id: "new-note-in-current-folder",
      name: "New note in current folder",
      callback: function () {
        var folder = plugin.selectedFolder;
        if (!folder) {
          var activeFile = plugin.app.workspace.getActiveFile();
          folder = activeFile && activeFile.parent ? activeFile.parent : plugin.app.vault.getRoot();
        }
        plugin.createNoteInFolder(folder);
      }
    });

    // Monkey-patch vault.create to redirect new untitled notes into the selected folder.
    this.origCreate = this.app.vault.create;
    var vault = this.app.vault;
    this.app.vault.create = async function (path, data, options) {
      // Use explicitly selected folder, or fall back to active file's folder
      var targetFolder = plugin.selectedFolder;
      if (!targetFolder) {
        var activeFile = plugin.app.workspace.getActiveFile();
        if (activeFile && activeFile.parent && activeFile.parent.path !== "/") {
          targetFolder = activeFile.parent;
        }
      }

      if (targetFolder && path.match(/^Untitled( \d+)?\.md$/)) {
        var basePath = targetFolder.path;

        // Deduplicate at the target folder
        var redirected = basePath + "/Untitled.md";
        var counter = 1;
        while (vault.getAbstractFileByPath(redirected)) {
          redirected = basePath + "/Untitled " + counter + ".md";
          counter++;
        }

        plugin.clearSelection();
        var newFile = await plugin.origCreate.call(vault, redirected, data, options);

        plugin.expandFolder(targetFolder);
        plugin.openInEditMode(newFile);

        return newFile;
      }
      return plugin.origCreate.call(vault, path, data, options);
    };
  }

  selectFolder(folder) {
    this.clearSelection();
    this.selectedFolder = folder;
    // Highlight the folder in the sidebar
    var el = document.querySelector('.nav-folder-title[data-path="' + folder.path + '"]');
    if (el) el.classList.add("is-selected-folder");
  }

  expandFolder(folder) {
    if (!folder || folder.path === "/") return;
    // Find the folder's nav element and expand it if collapsed
    var folderEl = document.querySelector('.nav-folder-title[data-path="' + folder.path + '"]');
    if (!folderEl) return;
    var navFolder = folderEl.closest(".nav-folder");
    if (navFolder && navFolder.classList.contains("is-collapsed")) {
      folderEl.click();
    }
  }

  clearSelection() {
    this.selectedFolder = null;
    var prev = document.querySelectorAll(".is-selected-folder");
    prev.forEach(function (el) { el.classList.remove("is-selected-folder"); });
  }

  openInEditMode(file) {
    var leaf = this.app.workspace.getLeaf(false);
    leaf.openFile(file, { state: { mode: "source" } });
  }

  async createNoteInFolder(folder) {
    var basePath = folder.path === "/" ? "" : folder.path;
    var name = "Untitled";
    var fullPath = basePath ? basePath + "/" + name + ".md" : name + ".md";

    var counter = 1;
    while (this.app.vault.getAbstractFileByPath(fullPath)) {
      var tryName = name + " " + counter;
      fullPath = basePath ? basePath + "/" + tryName + ".md" : tryName + ".md";
      counter++;
    }

    var newFile = await this.origCreate.call(this.app.vault, fullPath, "");
    this.expandFolder(folder);
    this.clearSelection();
    this.openInEditMode(newFile);
  }

  onunload() {
    if (this.origCreate) {
      this.app.vault.create = this.origCreate;
    }
    this.clearSelection();
  }
}

module.exports = NewNoteInFolderPlugin;
