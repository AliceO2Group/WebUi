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

import {h} from '/js/src/index.js';


/**
 * Shows header of list of layouts with one search input to filter them
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => [
  h('.w-50.text-center', [
    h('b.f4', 'Layouts'),
    ' ',
    h('span', `(${howManyItems(model)})`),
  ]),
  h('.flex-grow.text-right', [
    h('input.form-control.form-inline.mh1.w-33', {
      placeholder: 'Search',
      type: 'text',
      value: model.layout.searchInput,
      oninput: (e) => model.layout.search(e.target.value)
    })
  ]),
];

/**
 * Shows how many layouts are available or correspond to the filtering input
 * @param {Object} model
 * @return {vnode}
 */
const howManyItems = (model) => `${model.layout.list && model.layout.list.length} items`;
