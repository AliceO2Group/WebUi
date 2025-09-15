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

import FolderComponent from '../../folder/view/FolderComponent.js';
import { h } from '/js/src/index.js';
import SearchFilterModel from './model/SearchFilterModel.js';
import { createKeyValueFilter } from './FilterTypes.js';
import { filtersPanelPopover } from './filtersPanelPopover.js';

/**
 * Shows a list of layouts grouped by user and more
 * @param {Array<FolderModel>} folderModels - LayoutListModel.folders: The Folders used by LayoutListModel
 * @returns {vnode} - virtual node element
 */
export default (folderModels) => {
  const searchFilterModel = new SearchFilterModel();
  initializeSearchFilters(searchFilterModel.filterModel);

  return [
    h('.scroll-y.absolute-fill', [
      h(
        '.flex-row.text-right.m2',
        // h('.btn.btn-primary', 'Filter'),
        // eslint-disable-next-line @stylistic/js/array-bracket-newline
        [
          filtersPanelPopover(searchFilterModel.filterModel),
          h(
            'input.form-control.form-inline.mh1.w-33',
            {
              placeholder: 'Search',
              type: 'text',
              value: searchFilterModel.searchInput,
              // switch to search(undefined, e.target.value) when searching for objectPath
              // oninput: (e) => layoutListModel.search(undefined, e.target.value),
              oninput: (e) => {
                searchFilterModel.searchInput = e.target.value;
              },
            },
          ),
        ],
      ),

      h('', {
        style: 'display: flex; flex-direction: column',
      }, Array.from(folderModels.values()).map(FolderComponent)),
    ]),
  ];
};

/**
 * Initializes the filterModel model.
 * @param {import('./Filter.js').FilterModel} filterModel - filterModel of the searchFilterModel.
 */
function initializeSearchFilters(filterModel) {
  console.log(filterModel.register(createKeyValueFilter('objectPath', 'abc')));

  // TESTFUNCJASP(filterModel);
  return;
}

// function TESTFUNCJASP(filterModel) {
//   // filterModel.setValue('objectPath', 'test');
// }
