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
export default class ObjectTree extends Observable {
  /**
   * Instantiate tree with a root node called `name`, empty by default
   * @param {string} name - root name
   * @param {ObjectTree} parent - optional parent node
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
    this.object = null;
    this.open = name === 'qc' ? true : false;
    this.children = []; // <Array<ObjectTree>>
    this.parent = parent || null; // <ObjectTree>
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
    this.children.forEach((child) => child.openAll());
    this.notify();
  }

  /**
   * Close all nodes of the tree
   * @returns {undefined}
   */
  closeAll() {
    this.open = false;
    this.children.forEach((child) => child.closeAll());
    this.notify();
  }

  /**
   * Add recursively an object inside a tree
   * @param {Object} object - The object to be inserted, property name must exist
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
  addChild(object, path, pathParent) {
    // Fill the path argument through recursive call
    if (!path) {
      if (!object.name) {
        throw new Error('Object name must exist');
      }
      path = object.name.split('/');
      this.addChild(object, path, []);
      this.notify();
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
    subtree.addChild(object, path, fullPath);
  }

  /**
   * Add a list of objects by calling `addChild`
   * @param {Array<object>} objects - children to be added
   * @returns {undefined}
   */
  addChildren(objects) {
    objects.forEach((object) => this.addChild(object));
  }
}
