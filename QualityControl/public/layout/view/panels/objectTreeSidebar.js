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
import spinner from '../../../loader/spinner.js';
import { draw } from '../../../object/objectDraw.js';
import { iconCaretBottom, iconCaretRight, iconBarChart } from '/js/src/icons.js';
import virtualTable from '../../../object/virtualTable.js';

/**
 * Tree of object, searchable, inside the sidebar. Used to find objects and add them inside a layout
 * with page=layoutShow in edit mode.
 * It also contains a preview of selected object.
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export default (model) =>
  model.services.object.list.match({
    NotAsked: () => null,
    Loading: () => h('.flex-column.items-center', [spinner(2), h('.f6', 'Loading Objects')]),
    Success: () => [
      searchForm(model),
      h(
        '.scroll-y',
        model.object.searchInput.trim() !== '' ? virtualTable(model, 'side') : treeTable(model),
      ),
      objectPreview(model),
    ],
    Failure: (error) => h('.f6.danger.flex-column.text-center', [
      h('', 'Unable to list objects due to:'),
      h('', error.message),
    ]),
  });

/**
 * * An input which allows users to search though objects;
 * * A checkbox to switch to displaying only objects in Online Mode (displayed only if online mode is available)
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const searchForm = (model) => h('.flex-column.w-100.mv1', [
  h('.flex-row.w-100', [
    h('.w-100', 'Select objects to display:'),
    model.isOnlineModeEnabled &&
    h('.w-50.f6.flex-row', { style: 'justify-content: end;' }, [
      h('label.m0.ph1', {
        for: 'inputOnlineOnlyTreeSidebar',
        style: 'cursor: pointer',
      }, 'Online only'),
      h('input', {
        type: 'checkbox',
        id: 'inputOnlineOnlyTreeSidebar',
        onchange: (e) => model.object.toggleSideTree(e.target.checked),
      }),
    ]),
  ]),
  h('input.form-control.w-100', {
    placeholder: 'Search',
    type: 'text',
    value: model.object.searchInput,
    oninput: (e) => model.object.search(e.target.value),
  }),
]);

/**
 * Shows table of objects
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
function treeTable(model) {
  const attrs = {

    /**
     * Handler when a drag&drop has ended, when moving an object from the table
     * @returns {undefined}
     */
    ondragend() {
      model.layout.moveTabObjectStop();
    },
  };

  return h('table.table.table-sm.text-no-select.flex-grow.f6', attrs, [h('tbody', [treeRows(model)])]);
}

/**
 * Shows a list of lines <tr> of objects
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const treeRows = (model) => !model.object.sideTree
  ? null
  : model.object.sideTree.children.map((children) => treeRow(model, children, 0));

/**
 * Shows a line <tr> of object represented by parent node `tree`, also shows
 * sub-nodes of `tree` as additional lines if they are open in the tree.
 * Indentation is added according to tree level during recursive call of treeRow
 * Tree is traversed in depth-first with pre-order (root then subtrees)
 * @param {Model} model - root model of the application
 * @param {ObjectTree} sideTree - data-structure containing an object per node
 * @param {number} level - used for indentation within recursive call of treeRow
 * @returns {vnode} - virtual node element
 */
function treeRow(model, sideTree, level) {
  if (sideTree.object && sideTree.children.length === 0) {
    return [leafRow(model, sideTree, level)];
  } else if (sideTree.object && sideTree.children.length > 0) {
    return [
      leafRow(model, sideTree, level),
      branchRow(model, sideTree, level),
    ];
  } else {
    return [branchRow(model, sideTree, level)];
  }
}

/**
 * Shows a line <tr> of object represented by parent node `tree`, also shows
 * sub-nodes of `tree` as additional lines if they are open in the tree.
 * Indentation is added according to tree level during recursive call of treeRow
 * Tree is traversed in depth-first with pre-order (root then subtrees)
 * @param {Model} model - root model of the application
 * @param {ObjectTree} sideTree - data-structure containing an object per node
 * @param {number} level - used for indentation within recursive call of treeRow
 * @returns {vnode} - virtual node element
 */
const branchRow = (model, sideTree, level) => {
  const levelDeeper = level + 1;
  const subtree = sideTree.open ? sideTree.children.map((children) => treeRow(model, children, levelDeeper)) : [];

  const icon = sideTree.open ? iconCaretBottom() : iconCaretRight();
  const iconWrapper = h('span', { style: { paddingLeft: `${level}em` } }, icon);
  const path = sideTree.path.join('/');

  const attr = {
    key: `key-sidebar-tree-${path}`,
    title: path,
    onclick: () => sideTree.toggle(),
  };

  return [
    h('tr.object-selectable', attr, [h('td.text-ellipsis', [iconWrapper, ' ', sideTree.name])]),
    ...subtree,
  ];
};

/**
 * Shows a line <tr> of object represented by parent node `tree`, also shows
 * sub-nodes of `tree` as additional lines if they are open in the tree.
 * Indentation is added according to tree level during recursive call of treeRow
 * Tree is traversed in depth-first with pre-order (root then subtrees)
 * @param {Model} model - root model of the application
 * @param {ObjectTree} sideTree - data-structure containing an object per node
 * @param {number} level - used for indentation within recursive call of treeRow
 * @returns {vnode} - virtual node element
 */
const leafRow = (model, sideTree, level) => {
  // UI construction
  const iconWrapper = h('span', { style: { paddingLeft: `${level}em` } }, iconBarChart());
  const path = sideTree.path.join('/');
  const className = sideTree.object && sideTree.object === model.object.selected ? 'table-primary' : '';
  const draggable = Boolean(sideTree.object);

  const attr = {
    key: `key-sidebar-tree-${path}`,
    title: path,
    onclick: () => model.object.select(sideTree.object),
    class: className,
    draggable,
    ondragstart: () => {
      const newItem = model.layout.addItem(sideTree.object.name);
      model.layout.moveTabObjectStart(newItem);
    },
    ondblclick: () => model.layout.addItem(sideTree.object.name),
  };

  return h('tr.object-selectable', attr, h('td.text-ellipsis', [iconWrapper, ' ', sideTree.name]));
};

/**
 * Shows a JSROOT plot of selected object inside the tree of sidebar allowing the user to preview object and decide
 * if it should be added to layout
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const objectPreview = (model) => {
  const isSelected = model.object.selected;
  if (isSelected) {
    const objName = model.object.selected.name;
    return isSelected && h('.bg-white', { style: 'height: 20em' }, draw(model, objName, {}, 'treeSidebar'));
  }
};
