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
import { spinner } from '../../../common/spinner.js';
import { draw } from '../../../object/objectDraw.js';
import virtualTable from '../../../object/virtualTable.js';
import ObjectTreeComponent from '../../../pages/objectTreeView/component/ObjectTreeComponent.js';
import { branchItem, sideTreeLeafItem } from '../../../pages/objectTreeView/component/objectTreeItem.js';

/**
 * Tree of object, searchable, inside the sidebar. Used to find objects and add them inside a layout
 * with page=layoutShow in edit mode.
 * It also contains a preview of selected object.
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export default (model) =>{
  const { object, layout } = model;
  const { searchInput = '', tree } = object;

  return model.services.object.list.match({
    NotAsked: () => null,
    Loading: () => h('.flex-column.items-center', [spinner(2), h('.f6', 'Loading Objects')]),
    Success: (objects) => {
      let objectsToDisplay = [];
      if (searchInput.trim() !== '') {
        objectsToDisplay = objects.filter((qcObject) =>
          qcObject.name.toLowerCase().includes(searchInput.toLowerCase()));
      }
      return [
        searchForm(model),
        h(
          '.scroll-y',
          searchInput.trim() !== ''
            ? virtualTable(model, 'side', objectsToDisplay)
            : ObjectTreeComponent(tree, branchItem, (leafObject) => sideTreeLeafItem(leafObject, object, layout)),
        ),
        objectPreview(model),
      ];
    },
    Failure: (error) => h('.f6.danger.flex-column.text-center', [
      h('', 'Unable to list objects due to:'),
      h('', error.message),
    ]),
  });
};

/**
 * An input which allows users to search though objects;
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const searchForm = (model) => h('.flex-column.w-100.mv1', [
  h('.flex-row.w-100', [h('.w-100', 'Select objects to display:')]),
  h('input.form-control.w-100', {
    placeholder: 'Search',
    type: 'text',
    value: model.object.searchInput,
    oninput: (e) => model.object.search(e.target.value),
  }),
]);

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
    return isSelected && h('.bg-white', { style: 'height: 20em' }, draw(model, objName, {}));
  }
  return;
};
