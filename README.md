# Pensive

Notetaking software, heavily inspired by Obsidian and Notion, with some minor tweaks to support my style of notetaking during research and data exploration.

It's often useful to be able to arbitrarily narrow or expand the scope of the notes in view at any given time, making it easier to do focused work without getting distracted by notes that aren't currently relevant.
Pensive has a few key features that I was unable to find all together in other notetaking software:

- Notes are presented as a graph rather than as folders and files
- Flexible system for traversing the graph, including which notes are highlighted or hidden
- The full history is always stored, including the creation times of, and edits to, each note
- Images, files, and references to other parts of the graph are stored on notes directly
- Keyboard-based navigation, with multiple tabs and tab groups

## Keybinds

Currently the keyboard shortcuts aren't documented in the app, and aren't configurable. This is a complete list - at time of writing - until they're added as a list of configurable settings:

### Navigation

- `s`: focus the next entity
- `w`: focus the previous entity
- `a`: focus the parent of the current entity
- `d`: push the current entity to the stack
- `shift+a`: pop the current frame from the stack
- `ctrl+d`: pop the top of the current tab's stack and move it into its own tab
  - Note: this is infrequently used at the moment and will likely be changed in the near future

### Mutation

- `enter`: start adding a new entity as a child of the currently selected entity
  - `escape`: cancel adding a child entity
  - `enter`: confirm adding a child entity
- `/`: start adding a new section entity as a child of the currently selected entity
  - `escape`: cancel adding a sectiob entity
  - `enter`: confirm adding a sectiob entity
- `ctrl+/`: toggle whether the current entity is a section
- `shift+/`: start adding a new open entity as a child of the currently selected entity
  - `escape`: cancel adding an open entity
  - `enter`: confirm adding an open entity
- `shift+.`: toggle the current entity between open, closed, and neither
- `e`: start editing the text of the current entity
  - `escape`: cancel editing entity
  - `enter`: confirm editing entity
- `x`: start moving the selected entity
  - `escape`: cancel moving entity
  - `x`: confirm new parent of moved entity
- `ctrl+v`: paste image onto entity
- `delete,backspace`: delete the current entity
  - Note: this doesn't technically delete the current entity; it just removes the association to its parent

### Workspace

- `ctrl+tab`: move to the next tab in the tab group
- `ctrl+shift+tab`: move to the previous tab in the tab group
- `ctrl+w`: close the current tab
- `ctrl+t`: open a new tab on the root entity
- `alt+right`: move focus one tab group to the right
- `alt+left`: move focus one tab group to the left
- `ctrl+alt+right`: move tab one group to the right
- `ctrl+alt+left`: move tab one group to the left

### Querying

- `q`: toggle hiding non-section entities for the current tab
- `ctrl+f`: start editing the search text for the current tab
  - `enter`: unfocus the search text; go back to focusing the current tab
  - `escape`: remove and unfocus the search text
- `left`: collapse the current entity, preventing its children from being rendered, or making the current filter apply to it if it is excluded from the filter
- `right`: expand the current entity, allowing its children to be rendered, or forcing it to be rendered if it is hidden by the current filter
