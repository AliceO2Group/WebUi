/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { BrowserStorage, Observable, sessionService } from '/js/src/index.js';
import { StorageKeysEnum } from '../common/enums/storageKeys.enum.js';

/**
 * This class allows to transforms objects names (A/B/C) into a tree that can have
 * some behaviours like open/close nodes. It also allows to update all those objects without creating
 * a new tree.
 */
export default class ObjectTree extends Observable {
  static _indexIncrementCount = 0;

  /**
   * Instantiate tree with a root node called `name`, empty by default
   * @param {string} name - root name
   * @param {ObjectTree} parent - optional parent node
   */
  constructor(name, parent) {
    super();
    this._index = ObjectTree._indexIncrementCount++;
    this.focusedNode = null;
    this.openBranchStateStorage = new BrowserStorage(StorageKeysEnum.OBJECT_TREE_OPEN_BRANCH_STATE);
    this.initTree(name, parent);
  }

  get index() {
    return this._index;
  }

  get isBranch() {
    return this.children.length > 0;
  }

  get isLeaf() {
    return this.children.length === 0 && this.object !== null;
  }

  /**
   * Method to instantiate/reset the tree
   * @param {string} name - name of the tree to be initialized
   * @param {string} parent - parent of the tree
   * @returns {undefined}
   */
  initTree(name, parent) {
    this.name = name || ''; // Like 'B'
    this.object = null;
    this.open = name === 'qc' ? true : false;
    this.children = []; // <Array<ObjectTree>>
    this.parent = parent || null; // <ObjectTree>
    this.path = []; // Like ['A', 'B'] for node at path 'A/B' called 'B'
    this.pathString = ''; // 'A/B'
  }

  /**
   * Handles keyboard navigation for the tree
   * @param {string} key - The key value for navigation (e.g., "ArrowUp", "ArrowDown")
   * @param {(object: object) => void} onSelectObject - Callback function to select an object
   */
  handleKeyboardNavigation(key, onSelectObject) {
    const selectOrExpand = () => {
      if (this.focusedNode?.isLeaf && this.focusedNode.object) {
        onSelectObject(this.focusedNode.object);
        return;
      }
      this._expandFocusedNode();
    };
    const actions = {
      ['ArrowLeft']: () => this._collapseFocusedNode(),
      ['ArrowRight']: selectOrExpand,
      ['Enter']: selectOrExpand,
      ['ArrowUp']: () => this._focusPreviousNode(),
      ['ArrowDown']: () => this._focusNextNode(),
    };
    const action = actions[key];
    if (action) {
      action();
    }
  }

  /**
   * Set the focused node by index
   * @param {number} index - Index of the node to focus
   */
  setFocusedNodeByIndex(index) {
    const nodeToFocus = this._getVisibleNodes().find((node) => node.index === index);
    if (nodeToFocus) {
      this._setFocusedNode(nodeToFocus);
    }
  }

  /**
   * Set the currently focused node
   * @param {ObjectTree} node - node to be focused
   * @returns {undefined}
   */
  _setFocusedNode(node) {
    this.focusedNode = node;
    this.notify();
    requestAnimationFrame(() => {
      const container = document.getElementById('object-tree-scroll-container');
      const focusedRow = document.getElementById(`${node.index}`) || document.querySelector('.focused-node');
      if (!container || !focusedRow) {
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const rowRect = focusedRow.getBoundingClientRect();
      if (rowRect.top < containerRect.top) {
        // Row is above view — scroll up
        container.scrollTop += rowRect.top - containerRect.top;
      } else if (rowRect.bottom > containerRect.bottom) {
        // Row is below view — scroll down
        container.scrollTop += rowRect.bottom - containerRect.bottom;
      }
    });
  }

  /**
   * Collapse the currently focused node or its parent branch.
   * @returns {undefined}
   */
  _collapseFocusedNode() {
    if (!this.focusedNode) {
      return; // No focused node
    }
    // focus is on a leaf node -> collapse and focus parent
    const { isLeaf } = this.focusedNode;
    if (isLeaf) {
      const { parent } = this.focusedNode;
      if (!parent) {
        return; // No parent to collapse
      }
      parent.open = false;
      this._setFocusedNode(parent);
      return;
    }
    // focus is on a branch node -> collapse or focus parent
    const { isBranch, open } = this.focusedNode;
    if (isBranch) {
      if (open) {
        this.focusedNode.toggle();
        return;
      }
      const isNotRoot = Boolean(this.focusedNode.parent?.parent);
      if (isNotRoot) {
        this._setFocusedNode(this.focusedNode.parent);
        return;
      }
    }
  }

  /**
   * Expand the currently focused branch if closed or move focus to its first child.
   * @returns {undefined}
   */
  _expandFocusedNode() {
    if (!this.focusedNode) {
      return; // No focused node
    }
    if (!this.focusedNode.isBranch) {
      return; // Cannot expand a leaf
    }
    if (this.focusedNode.open) {
      this._setFocusedNode(this.focusedNode.children[0]); // Move focus to first child
    } else {
      this.focusedNode.toggle(); // Expand the branch
    }
  }

  /**
   * Get all visible nodes in the tree (for navigation)
   * @returns {Array.<ObjectTree>} - list of visible nodes
   */
  _getVisibleNodes() {
    const nodes = [];
    const traverse = (n) => {
      nodes.push(n);
      if (n.open) {
        n.children.forEach(traverse);
      }
    };
    this.children.forEach(traverse);
    return nodes;
  }

  /**
   * Focus the next visible node in the tree
   */
  _focusNextNode() {
    const visible = this._getVisibleNodes();
    // No visible nodes
    if (!visible.length) {
      return;
    }
    const idx = visible.indexOf(this.focusedNode);
    // At the last visible node, do nothing
    if (idx >= visible.length - 1) {
      return;
    }
    // Nothing focused yet -> focus first visible node
    if (!this.focusedNode || idx === -1) {
      const [first] = visible;
      this._setFocusedNode(first);
      return;
    }
    // Select next node
    const next = visible[idx + 1] ?? visible[idx];
    this._setFocusedNode(next);
  }

  /**
   * Focus the previous visible node in the tree.
   */
  _focusPreviousNode() {
    const visible = this._getVisibleNodes();
    // No visible nodes
    if (!visible.length) {
      return;
    }
    const idx = visible.indexOf(this.focusedNode);
    // At the first visible node, do nothing
    if (idx === 0) {
      return;
    }
    // Nothing focused yet -> focus first visible node
    if (!this.focusedNode || idx === -1) {
      const [first] = visible;
      this._setFocusedNode(first);
      return;
    }
    // Select previous node
    const prev = idx > 0 ? visible[idx - 1] : visible[0];
    this._setFocusedNode(prev);
  }

  /**
   * Load the expanded/collapsed state for this node and its children from localStorage.
   * Updates the `open` property for the current node and recursively for all children.
   */
  _loadExpandedBranches() {
    if (!this.parent) {
      // The main node may not be collapsable or expandable.
      // Because of this we also have to load the expanded state of their direct children.
      this.children.forEach((child) => child._loadExpandedBranches());
    }
    const session = sessionService.get();
    const key = session.personid.toString();
    // We traverse the path to reach the parent branch of this node
    let branchState = this.openBranchStateStorage.getLocalItem(key) ?? {};
    for (let i = 0; i < this.path.length - 1; i++) {
      branchState = branchState[this.path[i]];
      if (!branchState) {
        return; // Cannot expand marked node because parent path does not exist
      }
    }
    this._applyExpandedBranchesRecursive(branchState, this);
  }

  /**
   * Recursively traverse the stored data and update the tree nodes
   * @param {object} data - The current level of the hierarchical expanded nodes object
   * @param {ObjectTree} treeNode - The tree node to update
   */
  _applyExpandedBranchesRecursive(data, treeNode) {
    if (data[treeNode.name]) {
      treeNode.open = true;
      Object.keys(data[treeNode.name]).forEach((childName) => {
        // If two children share the same name, expand the one that has children
        const child =
          treeNode.children.find((c) => c.name === childName && c.isBranch) ||
          treeNode.children.find((c) => c.name === childName);
        if (child) {
          this._applyExpandedBranchesRecursive(data[treeNode.name], child);
        }
      });
    }
  }

  /**
   * Persist the current branch's expanded/collapsed state in localStorage.
   */
  _storeExpandedBranches() {
    if (!this.parent) {
      // The main node may not be collapsable or expandable.
      // Because of this we have to store the expanded state of their direct children.
      this.children.forEach((child) => child._storeExpandedBranches());
    }
    const session = sessionService.get();
    const key = session.personid.toString();
    const data = this.openBranchStateStorage.getLocalItem(key) ?? {};
    // We traverse the path to reach the parent branch of this node
    let branchState = data;
    for (let i = 0; i < this.path.length - 1; i++) {
      const pathKey = this.path[i];
      if (!branchState[pathKey]) {
        if (!this.open) {
          // Cannot remove marked branch because parent path does not exist
          // Due to this the marked branch also does not exist (so there is nothing to remove)
          return;
        }
        // Parent path does not exist, we create it here so we can mark a deeper branch
        branchState[pathKey] = {};
      }
      branchState = branchState[pathKey];
    }
    if (this.open) {
      this._markExpandedBranchesRecursive(branchState, this);
      this.openBranchStateStorage.setLocalItem(key, data);
    } else if (branchState[this.name]) {
      // Deleting from `branchState` directly updates the `data` object
      delete branchState[this.name];
      this.openBranchStateStorage.setLocalItem(key, data);
    }
  }

  /**
   * Recursively mark a node and all open children in the hierarchical "expanded nodes" object.
   * This method updates `data` to reflect the current node's expanded state:
   * - If the node has any open children, it creates an object branch and recursively marks those children.
   * - If the node has no open children (or is a leaf), it stores a marker value `{}`.
   * @param {object} data - The current level in the hierarchical data object where nodes are stored.
   * @param {ObjectTree} treeNode - The tree node whose expanded state should be stored.
   */
  _markExpandedBranchesRecursive(data, treeNode) {
    if (!data[treeNode.name]) {
      data[treeNode.name] = {};
    }
    treeNode.children
      .filter((child) => child.open)
      .forEach((child) => this._markExpandedBranchesRecursive(data[treeNode.name], child));
  };

  /**
   * Toggle this node (open/close)
   * @returns {undefined}
   */
  toggle() {
    this.open = !this.open;
    this._storeExpandedBranches();
    this.notify();
  }

  /**
   * Close all nodes of the tree
   */
  closeAll() {
    this._closeAllRecursive();
    this._storeExpandedBranches();
    this.notify();
  }

  /**
   * Recursively close all nodes without notifying.
   */
  _closeAllRecursive() {
    this.open = false;
    this.children.forEach((child) => child._closeAllRecursive());
  }

  /**
   * Add recursively an object inside a tree
   * @param {object} object - The object to be inserted, property name must exist
   * @param {Array.<string>} path - Path of the object to dig in before assigning to a tree node,
   * if null object.name is used
   * @param {Array.<string>} pathParent - Path of the current tree node, if null object.name is used
   *
   * Example of recursive call:
   *  addChild(o) // begin insert 'A/B'
   *  addChild(o, ['A', 'B'], [])
   *  addChild(o, ['B'], ['A'])
   *  addChild(o, [], ['A', 'B']) // end inserting, affecting B
   * @returns {undefined}
   */
  _addChild(object, path = undefined, pathParent = []) {
    // Fill the path argument through recursive call
    if (!path) {
      if (!object.name) {
        throw new Error('Object name must exist');
      }
      path = object.name.split('/');
      this._addChild(object, path);
      return;
    }
    // Case end of path, associate the object to 'this' node
    if (path.length === 0) {
      this.object = object;
      return;
    }
    // Case we need to pass to subtree
    const name = path.shift();
    const fullPath = [...pathParent, name];
    const requiresBranch = path.length > 0;
    // Find if subtree already exists
    const matchesNameAndType = requiresBranch
      ? (c) => c.name === name && c.isBranch
      : (c) => c.name === name && c.isLeaf;
    let subtree = this.children.find(matchesNameAndType);
    // Subtree does not exist yet - create it, then pass to child
    if (!subtree) {
      subtree = new ObjectTree(name, this);
      subtree.path = fullPath;
      subtree.pathString = fullPath.join('/');
      this.children.push(subtree);
      subtree.observe(() => this.notify()); // listen for changes and bubble to root
    }
    // Pass to child
    subtree._addChild(object, path, fullPath);
  }

  /**
   * Add a list of objects as child nodes
   * @param {Array<object>} objects - children to be added
   */
  addChildren(objects) {
    objects.forEach((object) => this._addChild(object));
    this._loadExpandedBranches();
    this.notify();
  }
}
