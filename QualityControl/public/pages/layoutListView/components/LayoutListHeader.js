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

/**
 * Shows header of list of layouts with one search input to filter them
 * @param {LayoutListModel} layoutListModel - The model handeling the state of the LayoutListPage
 * @returns {vnode} - virtual node element
 */
export default (layoutListModel) => [
  h('.w-50.text-center', [h('b.f4', 'Layouts')]),
  // eslint-disable-next-line @stylistic/js/array-bracket-newline
  h('.flex-grow.text-right', [
    h(layoutListModel.searchObjectPathMode ? '.btn.btn-primary' : '.btn', 'SearchMode'),
    // eslint-disable-next-line @stylistic/js/array-bracket-newline
  ], [
    h(
      'input.form-control.form-inline.mh1.w-33',

      layoutListModel.searchObjectPathMode ?
        {
          placeholder: 'Search',
          type: 'text',
          value: layoutListModel.searchInput,
          // switch to search(undefined, e.target.value) when searching for objectPath
          // oninput: (e) => layoutListModel.search(undefined, e.target.value),
          oninput: (e) => {
            layoutListModel.searchInput = e.target.value;
          },
        }
        :
        {
          placeholder: 'Search',
          type: 'text',
          value: layoutListModel.searchInput,
          // switch to search(undefined, e.target.value) when searching for objectPath
          oninput: (e) => layoutListModel.search(e.target.value),
        },
    ),
    // eslint-disable-next-line @stylistic/js/array-bracket-newline
  ]),
];

// /**
//  * Function responsible for getting the right input control body element.
//  * @param {LayoutListModel} layoutListModel - The model handeling the state of the LayoutListPage
//  * @returns {object} - object containing data for body of Mitril element
//  */
// function getSearchInputObject(layoutListModel) {
//   return layoutListModel.searchObjectPathMode ?
//     {
//       placeholder: 'Search',
//       type: 'text',
//       value: layoutListModel.searchInput,
//       // switch to search(undefined, e.target.value) when searching for objectPath
//       oninput: (e) => layoutListModel.search(e.target.value),
//     }
//     :
//     {
//       placeholder: 'Search',
//       type: 'text',
//       value: layoutListModel.searchInput,
//       // switch to search(undefined, e.target.value) when searching for objectPath
//       oninput: (e) => layoutListModel.search(e.target.value),
//     };
// }
