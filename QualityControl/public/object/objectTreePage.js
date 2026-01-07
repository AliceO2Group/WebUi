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

import {
  h,
  iconCollapseUp,
  iconBarChart,
  iconCaretRight,
  iconResizeBoth,
  iconCaretBottom,
  iconCircleX,
} from '/js/src/index.js';
import { spinner } from '../common/spinner.js';
import { draw } from '../common/object/draw.js';
import timestampSelectForm from './../common/timestampSelectForm.js';
import virtualTable from './virtualTable.js';
import { defaultRowAttributes, qcObjectInfoPanel } from '../common/object/objectInfoCard.js';
import { downloadButton } from '../common/downloadButton.js';
import { resizableDivider } from '../common/resizableDivider.js';
import { SortDirectionsEnum } from '../common/enums/columnSort.enum.js';
import { sortableTableHead } from '../common/sortButton.js';

/**
 * Shows a page to explore though a tree of objects with a preview on the right if clicked
 * and a status bar for selected object name and # of objects
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export default (model) => {
  const { object, router } = model;
  const { leftPanelWidthPercent } = object;
  return h('.h-100.flex-column', { key: `${router.params.page}` }, [
    h('.flex-row.flex-grow', [
      h('.scroll-y.flex-column', {
        style: {
          width: object.selected ? `${leftPanelWidthPercent}%` : '100%',
        },
      }, object.objectsRemote.match({
        NotAsked: () => null,
        Loading: () =>
          h('.absolute-fill.flex-column.items-center.justify-center.f5', [spinner(5), h('', 'Loading Objects')]),
        Success: () => {
          const searchInput = object?.searchInput?.trim() ?? '';
          if (searchInput !== '') {
            const objectsLoaded = object.list;
            const objectsToDisplay = objectsLoaded.filter((qcObject) =>
              qcObject.name.toLowerCase().includes(searchInput.toLowerCase()));
            return h('', [
              tableHeaderRow(model),
              virtualTable(model, 'side', objectsToDisplay),
            ]);
          }
          return h('', [
            tableHeaderRow(model),
            tableShow(model),
          ]);
        },
        Failure: () => null, // Notification is displayed
      })),
      object.selected && [
        resizableDivider((newWidthPercent) => model.object.setLeftPanelWidthPercent(newWidthPercent)),
        h('.animate-width.scroll-y.flex-grow', {
          key: `object-panel-${leftPanelWidthPercent}`,
        }, objectPanel(model)),
      ],
    ]),
    h('.f6.status-bar.ph1.flex-row', [
      statusBarLeft(model),
      statusBarRight(model),
    ]),
  ]);
};

/**
 * Method to tackle various states for the selected objects
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
function objectPanel(model) {
  const selectedObjectName = model.object.selected.name;
  if (model.object.objects && model.object.objects[selectedObjectName]) {
    return model.object.objects[selectedObjectName].match({
      NotAsked: () => null,
      Loading: () =>
        h('.h-100.w-100.flex-column.items-center.justify-center.f5', [spinner(3), h('', 'Loading Object')]),
      Success: (data) => drawPlot(model, data),
      Failure: (error) =>
        h('.h-100.w-100.flex-column.items-center.justify-center.f5', [h('.f1', iconCircleX()), error]),
    });
  }
  return null;
}

/**
 * Draw the object including the info button and history dropdown
 * @param {Model} model - root model of the application
 * @param {JSON} object - {qcObject, info, timestamps}
 * @returns {vnode} - virtual node element
 */
const drawPlot = (model, object) => {
  const { name, validFrom, id } = object;
  const href = validFrom ?
    `?page=objectView&objectName=${name}&ts=${validFrom}&id=${id}`
    : `?page=objectView&objectName=${name}`;
  return h('', { style: 'height:100%; display: flex; flex-direction: column' }, [
    h('.item-action-row.flex-row.g1.p1', [
      downloadButton({
        href: model.objectViewModel.getDownloadQcdbObjectUrl(object.id),
        title: 'Download object',
      }),
      h(
        'a.btn#fullscreen-button',
        {
          title: 'Open object plot in full screen',
          href,
          onclick: (e) => model.router.handleLinkEvent(e),
        },
        iconResizeBoth(),
      ),
      h(
        'a.btn#close-button',
        {
          title: 'Close the object plot',
          onclick: () => model.object.select(),
        },
        iconCircleX(),
      ),
    ]),
    h('', { style: 'height:77%;' }, draw(model.object.objects[name], { }, ['stat'], (error) => {
      model.object.invalidObject(name, error.message);
    })),
    h('.scroll-y', {}, [
      h('.w-100.flex-row', { style: 'justify-content: center' }, h('.w-80', timestampSelectForm(model))),
      qcObjectInfoPanel(object, { 'font-size': '.875rem;' }, defaultRowAttributes(model.notification)),
    ]),
  ]);
};

/**
 * Shows status of current tree with its options (online, loaded, how many)
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
function statusBarLeft(model) {
  let itemsInfo = '';
  if (!model.object.currentList) {
    itemsInfo = 'Loading objects...';
  } else if (model.object.searchInput) {
    itemsInfo = `${model.object.searchResult.length} found of ${model.object.currentList.length} items`;
  } else {
    itemsInfo = `${model.object.currentList.length} items`;
  }

  return h('span.flex-grow', itemsInfo);
}

/**
 * Shows current selected object path
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const statusBarRight = (model) => model.object.selected
  ? h('span.right', model.object.selected.name)
  : null;

/**
 * Shows a tree of objects inside a table with indentation
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const tableShow = (model) =>
  h('table.table.table-sm.text-no-select', h('tbody', [treeRows(model)]));

const tableHeaderRow = (model) => h('.bg-gray-light.pv2', [
  sortableTableHead({
    order: model.object.sortBy.order,
    icon: model.object.sortBy.icon,
    label: 'Name',
    sortOptions: [SortDirectionsEnum.ASC, SortDirectionsEnum.DESC],
    onclick: (label, order, icon) => {
      model.object.sortTree(label, 'name', order, icon);
    },
  }),
  tableHeader(model.object),
]);

const tableHeader = (qcObject) =>
  h('.flex-row.w-100', [
    tableSearchInput(qcObject),
    tableCollapseAll(qcObject),
  ]);

const tableCollapseAll = (qcObject) =>
  h('button.btn.m2', {
    title: 'Close whole tree',
    onclick: () => qcObject.tree.closeAll(),
    disabled: Boolean(qcObject.searchInput),
  }, iconCollapseUp());

const tableSearchInput = (qcObject) =>
  h('input.form-control.form-inline.mv2.mh3.flex-grow', {
    id: 'searchObjectTree',
    placeholder: 'Search',
    type: 'text',
    value: qcObject.searchInput,
    disabled: qcObject.queryingObjects ? true : false,
    oninput: (e) => qcObject.search(e.target.value),
  });

/**
 * Shows a list of lines <tr> of objects
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const treeRows = (model) => !model.object.tree ?
  null
  :

  model.object.tree.children.length === 0
    ? h('.w-100.text-center', 'No objects found')
    : model.object.tree.children.map((children) => treeRow(model, children));

/**
 * Shows a line <tr> of object represented by parent node `tree`, also shows
 * sub-nodes of `tree` as additional lines if they are open in the tree.
 * Indentation is added according to tree level during recursive call of treeRow
 * Tree is traversed in depth-first with pre-order (root then subtrees)
 * @param {Model} model - root model of the application
 * @param {ObjectTree} tree - data-structure containing an object per node
 * @param {number} level - used for indentation within recursive call of treeRow
 * @returns {vnode[]} - virtual node element
 */
function treeRow(model, tree, level = 0) {
  const { pathString, open, children, object, name } = tree;

  const childRow = open
    ? children.flatMap((children) => treeRow(model, children, level + 1))
    : [];

  const rows = [];

  if (object) {
    // Add a leaf row (final element; cannot be expanded further)
    const className = object === model.object.selected ? 'table-primary' : '';
    const leaf = treeRowElement(
      pathString,
      name,
      () => model.object.select(object),
      iconBarChart,
      className,
      {
        paddingLeft: `${level + 0.3}em`,
      },
    );
    rows.push(leaf);
  }
  if (children.length > 0) {
    // Add a branch row (expandable / collapsible element)
    const branch = treeRowElement(
      pathString,
      name,
      () => tree.toggle(),
      open ? iconCaretBottom : iconCaretRight,
      '',
      {
        paddingLeft: `${level + 0.3}em`,
      },
    );
    rows.push(branch);
  }

  return [...rows, ...childRow];
}

/**
 * Creates a row containing specific visuals for either a branch or a leaf object
 * and on click it will expand/collapse the branch or plot the leaf object with JSRoot
 * @param {string} key - An unique identifier for this branch row element (table row)
 * @param {string} title - The name of this tree object element
 * @param {() => void} onclick - The action (callback) to perform upon clicking this branch row element (table row)
 * @param {() => vnode} icon - Icon renderer for the row
 * @param {string} className - Optional CSS class name(s) for the outer branch row element (table row)
 * @param {object} style - Optional CSS styling for the inner branch row element (table data)
 * @returns {vnode} - virtual node element
 */
const treeRowElement = (key, title, onclick, icon, className = '', style = {}) =>
  h('tr.object-selectable', {
    key,
    id: key,
    title,
    onclick,
    class: className,
  }, [
    h('td.highlight.flex-row.items-center.g1', { style }, [
      icon(),
      title,
    ]),
  ]);
