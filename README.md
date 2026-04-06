# New Note in Folder

Creates new notes in the right place — next to whatever you're working on, not at the vault root. Works like VS Code's "New File" button.

## Usage

- **Click a folder** in the sidebar, then click the **new note** button — the note is created inside that folder
- **Click a file** in the sidebar, then click **new note** — the note is created in that file's folder
- **Editing a file** and click **new note** — the note is created next to the file you're editing
- **Right-click a folder** > **New note here** — same thing, from the context menu

New notes open in edit mode so you can start typing immediately.

## Features

- Folder selection highlighted in the sidebar
- Automatic deduplication (Untitled, Untitled 1, Untitled 2, etc.)
- Collapsed folders expand when a note is created inside them
- Falls back to the active file's folder when nothing is explicitly selected
- Also available via command palette: **New note in current folder**

## Installation

Copy the plugin folder to `.obsidian/plugins/new-note-in-folder/` and enable it in Settings > Community Plugins.

## License

MIT
