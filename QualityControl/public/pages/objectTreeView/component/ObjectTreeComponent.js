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

import { h, iconBarChart, iconCaretRight, iconCaretBottom } from '/js/src/index.js';
import ObjectTreeModel from '../model/ObjectTreeModel.js';

/**
 * Shows a tree of objects using nested lists
 * @param {ObjectTreeModel} treeModel - the model that controls this tree's state
 * @returns {vnode} - virtual node element
 */
export default function (treeModel) {
  return [
    h('.heading', 'Name'),
    h('ul.root-tree', [treeItems(treeModel)]),
  ];
}

/**
 * Recursively renders tree items
 * @param {ObjectTreeModel} treeModel - the model that controls this tree's state
 * @returns {Array<vnode>} - array of virtual node elements
 */
const treeItems = (treeModel) =>
  treeModel.children.map((child) =>
    child instanceof ObjectTreeModel
      ? branchItem(child)
      : leafItem(child));

/**
 * Creates a list item for a branch (folder-like node that can be expanded/collapsed)
 * @param {ObjectTreeModel} treeModel - current tree branch
 * @returns {vnode} - virtual node element
 */
const branchItem = (treeModel) => {
  const { name, open } = treeModel;

  return h('li.object-tree-branch', { title: name }, [
    h('div.object-selectable', { onclick: () => treeModel.toggle() }, [
      h('span', open ? iconCaretBottom() : iconCaretRight()),
      ' ',
      name,
    ]),
    open ? h('ul.object-tree-list', treeItems(treeModel)) : null,
  ]);
};

/**
 * Creates a list item for a leaf (end node that represents an object)
 * @param {object} leaf - the leaf object
 * @returns {vnode} - virtual node element
 */
const leafItem = (leaf) => {
  const { name, path } = leaf;
  const displayName = name.split('/').pop();

  return h('li.object-tree-leaf', { key: path }, [
    h('div.object-selectable', {
      onclick: () => model.object.select(leaf),
      title: path,
    }, [
      h('span', iconBarChart()),
      ' ',
      displayName,
    ]),
  ]);
};
