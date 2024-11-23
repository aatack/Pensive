export const keyboardShortcuts = {
  // Traversal
  traverseParent: "a",
  traverseFollowing: ["d", "s"],
  traversePreceding: "w",
  traverseFollowingSibling: "shift+down",
  traversePrecedingSibling: "shift+up",

  // Adding and editing items
  addChild: "enter",
  addSection: "shift+s",
  addOpen: "shift+d",
  editText: "shift+enter",
  pasteImage: "ctrl+v",
  clearTool: "escape",
  removeParent: "delete",
  toggleOpen: "ctrl+d",
  toggleSection: "ctrl+s",
} as const;
