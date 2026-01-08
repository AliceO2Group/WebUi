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
import { filtersPanelPopover } from './filtersPanelPopover.js';

/**
 * Shows a list of layouts grouped by user and more
 * @param {LayoutListModel} layoutListModel - LayoutListModel which contains the folders and searchfiltermodel.
 * @returns {vnode} - virtual node element
 * @import LayoutListModel from './model/LayoutListModel.js';
 */
export default (layoutListModel) => [
  h('.flex-row.text-right.m2', [
    filtersPanelPopover(layoutListModel.searchFilterModel),
    h('input.form-control.form-inline.mh1.w-33', {
      placeholder: 'Layout name',
      type: 'text',
      value: layoutListModel.searchFilterModel.searchInput,
      oninput: (e) => {
        layoutListModel.search(e.target.value);
      },
    }),
    h('.p1', [
      h(
        '.mh1',
        layoutListModel.searchFilterModel.stringifyActiveFiltersFriendly(),
      ),
    ]),
  ]),

  h('', {
    key: 'layout-list-page-folders-container',
  }, Array.from(layoutListModel.folders.values()).map(FolderComponent)),
];
