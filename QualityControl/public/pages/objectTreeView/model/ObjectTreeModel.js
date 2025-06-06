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

import { Observable } from '/js/src/index.js';

/**
 * This class allows to transforms objects names (A/B/C) into a tree that can have
 * some behaviours like open/close nodes. It also allows to update all those objects without creating
 * a new tree.
 */
export default class ObjectTreeModel extends Observable {
  /**
   * Instantiate tree with a root node called `name`, empty by default
   * @param {string} name - root name
   * @param {ObjectTreeModel} parent - optional parent node
   */
  constructor(name, parent) {
    super();
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
    this.open = name === 'qc' ? true : false;
    this.children = []; // <Array<ObjectTreeModel|object>>
    this.parent = parent || null; // <ObjectTreeModel>
    this.path = []; // Like ['A', 'B'] for node at path 'A/B' called 'B'
    this.pathString = ''; // 'A/B'
  }

  /**
   * Toggle this node (open/close)
   * @returns {undefined}
   */
  toggle() {
    this.open = !this.open;
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
    this.children.forEach((child) => child instanceof ObjectTreeModel && child.openAll());
    this.notify();
  }

  /**
   * Close all nodes of the tree
   * @returns {undefined}
   */
  closeAll() {
    this.open = false;
    this.children.forEach((child) => child instanceof ObjectTreeModel && child.closeAll());
    this.notify();
  }

  /**
   * Add recursively an objectModel inside a tree
   * @param {object} objectModel - The objectModel to be inserted, property name must exist
   * @param {Array.<string>} path - Path of the objectModel to dig in before assigning to a tree node,
   * if null objectModel.name is used
   * @param {Array.<string>} pathParent - Path of the current tree node, if null objectModel.name is used
   *
   * Example of recursive call:
   *  addChild(o) // begin insert 'A/B'
   *  addChild(o, ['A', 'B'], [])
   *  addChild(o, ['B'], ['A'])
   *  addChild(o, [], ['A', 'B']) // end inserting, affecting B
   * @returns {undefined}
   */
  addChild(objectModel, path, pathParent) {
    // Fill the path argument through recursive call
    if (!path) {
      if (!objectModel.name) {
        throw new Error('Object name must exist');
      }
      path = objectModel.name.split('/');
      path.length--; // The last one is the object name, which isn't needed for the path
      this.addChild(objectModel, path, []);
      this.notify();
      return;
    }

    if (path.length === 0) {
      this.children.push(objectModel);
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
      subtree = new ObjectTreeModel(name, this);
      subtree.path = fullPath;
      subtree.pathString = fullPath.join('/');
      this.children.push(subtree);
      subtree.observe(() => this.notify());
    }

    // Pass to child
    subtree.addChild(objectModel, path, fullPath);
  }

  /**
   * Add a list of objects by calling `addChild`
   * @param {Array<object>} objects - children to be added
   * @returns {undefined}
   */
  addChildren(objects) {
    objects.forEach((object) => this.addChild(object));
  }

  /**
   * Recursively sorts the children of this tree node by a specified field and order,
   * and maintains the sort throughout the entire subtree. Updates the tree state
   * and triggers a notification after sorting.
   * @param {string} field - The property name of child objects to sort by
   * @param {number} order - acending (1) or decending (-1)
   * @returns {undefined}
   */
  sortChildren(field, order) {
    this.children = this.children.sort((child1, child2) => this._compareStrings(child1[field], child2[field], order));
    this.children.forEach((child) =>
      child instanceof ObjectTreeModel && child.sortChildren(field, order));

    this.notify();
  }

  /**
   * Helper method for sortListByField for sorting strings
   * @param {string} a - first string to be sorted
   * @param {string} b - second string to be sorted
   * @param {number} order - acending (1) or decending (-1)
   * @returns {undefined}
   */
  _compareStrings(a, b, order) {
    return a.toUpperCase().localeCompare(b.toUpperCase()) * order;
  }
}
