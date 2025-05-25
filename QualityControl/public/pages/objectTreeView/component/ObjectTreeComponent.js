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

import { h } from '/js/src/index.js';
import ObjectTreeModel from '../model/ObjectTreeModel.js';

/**
 * Shows a tree of objects using nested lists
 * @param {ObjectTreeModel} treeModel - the model that controls this tree's state
 * @param {Function} branchItem - function that receives an ObjectTreeModel and returns a vnode
 * @param {Function} leafItem - function that receives a object and returns a vnode
 * @returns {vnode} - virtual node element
 */
export default function (treeModel, branchItem, leafItem) {
  return [
    h('.heading', 'Name'),
    h('ul.root-tree', treeItems(treeModel, branchItem, leafItem)),
  ];
}

/**
 * Recursively renders tree items
 * @param {ObjectTreeModel} treeModel - the model that controls this tree's state
 * @param {Function} branchItem - function that receives an ObjectTreeModel and returns a vnode
 * @param {Function} leafItem - function that receives a object and returns a vnode
 * @returns {Array<vnode>} - array of virtual node elements
 */
const treeItems = (treeModel, branchItem, leafItem) =>
  treeModel.children.map((child) => child instanceof ObjectTreeModel ?
    branchItem(child, () => treeItems(child, branchItem, leafItem)) : leafItem(child));
