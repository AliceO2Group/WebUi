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

import { filterPanelToggleButton } from '../../../common/filters/filterViews.js';
import { h } from '/js/src/index.js';

/**
 * Shows header of list of layouts with one search input to filter them
 * @param {LayoutListModel} layoutListModel - The model handeling the state of the LayoutListPage
 * @param {FilterModel} filterModel - The model handeling the filter state
 * @returns {vnode} - virtual node element
 */
export default (layoutListModel, filterModel) => [
  h('.w-50.text-center', [h('b.f4', 'Layouts')]),
  h('.flex-grow.text-right', [
    filterPanelToggleButton(filterModel),
    h('input.form-control.form-inline.mh1.w-33', {
      placeholder: 'Search',
      type: 'text',
      value: layoutListModel.searchInput,
      oninput: (e) => layoutListModel.search(e.target.value),
    }),
  ]),
];
