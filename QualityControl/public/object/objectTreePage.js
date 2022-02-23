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

import {h, iconBarChart, iconCaretRight, iconResizeBoth, iconCaretBottom, iconCircleX} from '/js/src/index.js';
import spinner from '../loader/spinner.js';
import {draw} from './objectDraw.js';
import infoButton from './../common/infoButton.js';
import timestampSelectForm from './../common/timestampSelectForm.js';
import virtualTable from './virtualTable.js';

/**
 * Shows a page to explore though a tree of objects with a preview on the right if clicked
 * and a status bar for selected object name and # of objects
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.h-100.flex-column', {key: model.router.params.page}, [
  h('.flex-row.flex-grow', [
    h('.scroll-y.flex-column', {
      style: {
        width: model.object.selected ? '50%' : '100%'
      },
    }, model.object.searchInput.trim() !== '' ?
      virtualTable(model, 'main')
      :
      model.object.objectsRemote.match({
        NotAsked: () => null,
        Loading: () => h('.absolute-fill.flex-column.items-center.justify-center.f5', [
          spinner(5), h('', 'Loading Objects')
        ]),
        Success: () => tableShow(model),
        Failure: () => null, // notification is displayed
      })
    ),
    h('.animate-width.scroll-y', {
      style: {
        width: model.object.selected ? '50%' : 0
      }
    }, model.object.selected ? objectPanel(model) : null
    )
  ]),
  h('.f6.status-bar.ph1.flex-row', [
    statusBarLeft(model),
    statusBarRight(model),
  ])
]);

/**
 * Method to tackle various states for the selected objects
 * @param {Object} model
 * @return {vnode}
 */
function objectPanel(model) {
  const selectedObjectName = model.object.selected.name;
  if (model.object.objects && model.object.objects[selectedObjectName]) {
    return model.object.objects[selectedObjectName].match({
      NotAsked: () => null,
      Loading: () => h('.h-100.w-100.flex-column.items-center.justify-center.f5', [
        spinner(3), h('', 'Loading Object')]),
      Success: (data) => drawPlot(model, data),
      Failure: (error) => h('.h-100.w-100.flex-column.items-center.justify-center.f5', [
        h('.f1', iconCircleX()), error]),
    });
  }
  return null;
}

/**
 * Draw the object including the info button and history dropdown
 * @param {Object} model
 * @param {JSON} object - {qcObject, info, timestamps}
 * @return {vnode}
 */
const drawPlot = (model, object) => {
  const name = model.object.selected.name;
  const info = object.info;
  return h('', {style: 'height:100%; display: flex; flex-direction: column'},
    [
      h('.resize-button.flex-row', [
        infoButton(model.object, model.isOnlineModeEnabled),
        h('.p1.text-left', {style: 'padding-bottom: 0;'},
          h('a.btn',
            {
              title: 'Open object plot in full screen',
              href: `?page=objectView&objectName=${name}`,
              onclick: (e) => model.router.handleLinkEvent(e)
            }, iconResizeBoth()
          )
        )]),
      h('', {style: 'height:77%;'},
        draw(model, name, {stat: true}, 'treePage')
      ),
      h('.scroll-y', {}, [
        h('.w-100.flex-row', {style: 'justify-content: center'}, h('.w-50', timestampSelectForm(model))),
        h('.w-100', {style: 'justify-content: center;'}, [
          Object.keys(info)
            .filter((key) =>
              ['ObjectType', 'qc_detector_name', 'RunNumber', 'qc_task_name', 'qc_task_class', 'qc_version']
                .includes(key)
            )
            .map((key) => h('.flex-row.f6', [
              h('.w-30', key),
              h('.w-70', info[key])
            ]))
        ]),
      ])
    ]
  );
};

/**
 * Shows status of current tree with its options (online, loaded, how many)
 * @param {Object} model
 * @return {vnode}
 */
function statusBarLeft(model) {
  let itemsInfo;
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
 * @param {Object} model
 * @return {vnode}
 */
const statusBarRight = (model) => model.object.selected
  ? h('span.right', model.object.selected.name)
  : null;

/**
 * Shows a tree of objects inside a table with indentation
 * @param {Object} model
 * @return {vnode}
 */
const tableShow = (model) =>
  h('table.table.table-sm.text-no-select', [
    h('thead', [
      h('tr', [
        h('th', 'Name'),
      ])
    ]),
    h('tbody', [
      treeRows(model),
    ])
  ]);

/**
 * Shows a list of lines <tr> of objects
 * @param {Object} model
 * @return {vnode}
 */
const treeRows = (model) => !model.object.tree ?
  null
  :
  (
    (model.object.tree.children.length === 0) ?
      h('.w-100.text-center', 'No objects found')
      :
      model.object.tree.children.map((children) => treeRow(model, children, 0))
  );


/**
 * Shows a line <tr> of object represented by parent node `tree`, also shows
 * sub-nodes of `tree` as additional lines if they are open in the tree.
 * Indentation is added according to tree level during recursive call of treeRow
 * Tree is traversed in depth-first with pre-order (root then subtrees)
 * @param {Object} model
 * @param {ObjectTree} tree - data-structure containing an object per node
 * @param {number} level - used for indentation within recursive call of treeRow
 * @return {vnode}
 */
function treeRow(model, tree, level) {
  const padding = `${level}em`;
  const levelDeeper = level + 1;
  const children = tree.open ? tree.children.map((children) => treeRow(model, children, levelDeeper)) : [];
  const path = tree.path.join('/');
  const className = tree.object && tree.object === model.object.selected ? 'table-primary' : '';

  if (model.object.searchInput) {
    return [];
  } else {
    if (tree.object && tree.children.length === 0) {
      return [leafRow(path, () => model.object.select(tree.object), className, padding, tree.name)];
    } else if (tree.object && tree.children.length > 0) {
      return [
        leafRow(path, () => model.object.select(tree.object), className, padding, tree.name),
        branchRow(path, tree, padding),
        children
      ];
    }
    return [
      branchRow(path, tree, padding),
      children
    ];
  }
}

/**
 * Creates a row containing specific visuals for leaf object and on selection
 * it will plot the object with JSRoot
 * @param {String} path - full name of the object
 * @param {Action} selectItem - action for plotting the object
 * @param {String} className - name of the row class
 * @param {number} padding - space needed to be displayed so that leaf is within its parent
 * @param {String} leafName - name of the object
 * @return {vnode}
 */
const leafRow = (path, selectItem, className, padding, leafName) =>
  h('tr.object-selectable', {key: path, title: path, onclick: selectItem, class: className}, [
    h('td.highlight', [
      h('span', {style: {paddingLeft: padding}}, iconBarChart()), ' ', leafName]),
  ]);

/**
 * Creates a row containing specific visuals for branch object and on selection
 * it will open its children
 * @param {String} path - full name of the object
 * @param {ObjectTree} tree - current selected tree
 * @param {number} padding - space needed to be displayed so that branch is within its parent
 * @return {vnode}
 */
const branchRow = (path, tree, padding) =>
  h('tr.object-selectable', {key: path, title: path, onclick: () => tree.toggle()}, [
    h('td.highlight', [
      h('span', {style: {paddingLeft: padding}}, tree.open ? iconCaretBottom() : iconCaretRight()),
      ' ',
      tree.name
    ]),
  ]);
