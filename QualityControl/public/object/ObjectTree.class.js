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
  /**
   * Instantiate tree with a root node called `name`, empty by default
   * @param {string} name - root name
   * @param {ObjectTree} parent - optional parent node
   */
  constructor(name, parent) {
    super();
    this.storage = new BrowserStorage(StorageKeysEnum.OBJECT_TREE_OPEN_NODES);
    this.initTree(name, parent);
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
   * Load the expanded/collapsed state for this node and its children from localStorage.
   * Updates the `open` property for the current node and recursively for all children.
   */
  loadExpandedNodes() {
    if (!this.parent) {
      // The main node may not be collapsable or expandable.
      // Because of this we also have to load the expanded state of their direct children.
      this.children.forEach((child) => child.loadExpandedNodes());
    }

    const session = sessionService.get();
    const key = session.personid.toString();

    // We traverse the path to reach the parent object of this node
    let parentNode = this.storage.getLocalItem(key) ?? {};
    for (let i = 0; i < this.path.length - 1; i++) {
      parentNode = parentNode[this.path[i]];
      if (!parentNode) {
        // Cannot expand marked node because parent path does not exist
        return;
      }
    }

    this._applyExpandedNodesRecursive(parentNode, this);
  }

  /**
   * Recursively traverse the stored data and update the tree nodes
   * @param {object} data - The current level of the hierarchical expanded nodes object
   * @param {ObjectTree} treeNode - The tree node to update
   */
  _applyExpandedNodesRecursive(data, treeNode) {
    if (data[treeNode.name]) {
      treeNode.open = true;
      Object.keys(data[treeNode.name]).forEach((childName) => {
        const child = treeNode.children.find((child) => child.name === childName);
        if (child) {
          this._applyExpandedNodesRecursive(data[treeNode.name], child);
        }
      });
    }
  };

  /**
   * Persist the current node's expanded/collapsed state in localStorage.
   */
  storeExpandedNodes() {
    const session = sessionService.get();
    const key = session.personid.toString();
    const data = this.storage.getLocalItem(key) ?? {};

    // We traverse the path to reach the parent object of this node
    let parentNode = data;
    for (let i = 0; i < this.path.length - 1; i++) {
      const pathKey = this.path[i];
      if (!parentNode[pathKey]) {
        if (!this.open) {
          // Cannot remove marked node because parent path does not exist
          // Due to this the marked node also does not exist (so there is nothing to remove)
          return;
        }

        // Parent path does not exist, we create it here so we can mark a deeper node
        parentNode[pathKey] = {};
      }

      parentNode = parentNode[pathKey];
    }

    if (this.open) {
      this._markExpandedNodesRecursive(parentNode, this);
      this.storage.setLocalItem(key, data);
    } else if (parentNode[this.name]) {
      // Deleting from `parentNode` directly updates the `data` object
      delete parentNode[this.name];
      this.storage.setLocalItem(key, data);
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
  _markExpandedNodesRecursive(data, treeNode) {
    if (!data[treeNode.name]) {
      data[treeNode.name] = {};
    }
    treeNode.children
      .filter((child) => child.open)
      .forEach((child) => this._markExpandedNodesRecursive(data[treeNode.name], child));
  };

  /**
   * Toggle this node (open/close)
   * @returns {undefined}
   */
  toggle() {
    this.open = !this.open;
    this.storeExpandedNodes();
    this.notify();
  }

  /**
   * Open all or close all nodes of the tree
   * @returns {undefined}
   */
  toggleAll() {
    this.open ? this.closeAll() : this.openAll();
  }

  /**
   * Open all nodes of the tree
   * @returns {undefined}
   */
  openAll() {
    this.open = true;
    this.children.forEach((child) => child.openAll());
    this.storeExpandedNodes();
    this.notify();
  }

  /**
   * Close all nodes of the tree
   * @returns {undefined}
   */
  closeAll() {
    this.open = false;
    this.children.forEach((child) => child.closeAll());
    this.storeExpandedNodes();
    this.notify();
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
    let subtree = this.children.find((children) => children.name === name);

    // Subtree does not exist yet
    if (!subtree) {
      /*
       * Create it and push as child
       * Listen also for changes to bubble it until root
       */
      subtree = new ObjectTree(name, this);
      subtree.path = fullPath;
      subtree.pathString = fullPath.join('/');
      this.children.push(subtree);
      subtree.observe(() => this.notify());
    }

    // Pass to child
    subtree._addChild(object, path, fullPath);
  }

  /**
   * Add a single object as a child node
   * @param {object} object - child to be added
   */
  addOneChild(object) {
    this._addChild(object);
    this.loadExpandedNodes();
    this.notify();
  }

  /**
   * Add a list of objects as child nodes
   * @param {Array<object>} objects - children to be added
   */
  addChildren(objects) {
    objects.forEach((object) => this._addChild(object));
    this.loadExpandedNodes();
    this.notify();
  }
}
