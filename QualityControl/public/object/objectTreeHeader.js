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
import {iconCollapseUp, iconArrowBottom, iconArrowTop} from '/js/src/icons.js';

/**
 * Shows header for the objects tree page, buttons allow to open/close the entire tree,
 * filter only 'online' objects thanks to information service and a search input allow to filter
 * by name.
 * @param {Object} model
 * @return {vnode}
 */
export default function objectTreeHeader(model) {
  if (!model.object.currentList) {
    return null;
  }

  const howMany = model.object.searchInput
    ? `${model.object.searchResult.length} found of ${model.object.currentList.length}`
    : `${model.object.currentList.length} items`;

  return [
    h('.w-33.text-center', [
      h('b.f4', 'Objects'),
      ' ',
      model.object.objectsRemote.isSuccess() && h('span', `(${howMany})`),
    ]),
    h('.flex-grow.text-right', [
      h('.dropdown', {
        title: 'Sort by', class: model.object.sortBy.open ? 'dropdown-open' : ''
      }, [
        h('button.btn', {
          title: 'Sort by',
          onclick: () => model.object.toggleSortDropdown()
        }, [model.object.sortBy.title, ' ', model.object.sortBy.icon]),
        h('.dropdown-menu.text-left', [
          !model.isOnlineModeEnabled
          && sortMenuItem(model, 'Created Time', 'Sort by time of creation ASC', iconArrowTop(), 'createTime', 1),
          !model.isOnlineModeEnabled
          && sortMenuItem(model, 'Created Time', 'Sort by time of creation DESC', iconArrowBottom(), 'createTime', -1),
          sortMenuItem(model, 'Name', 'Sort by name ASC', iconArrowTop(), 'name', 1),
          sortMenuItem(model, 'Name', 'Sort by name DESC', iconArrowBottom(), 'name', -1),

        ]),
      ]),
      ' ',
      h('button.btn', {
        title: 'Close whole tree',
        onclick: () => model.object.tree.closeAll(),
        disabled: !!model.object.searchInput
      }, iconCollapseUp()),
      ' ',
      h('input.form-control.form-inline.mh1.w-33', {
        placeholder: 'Search',
        type: 'text',
        value: model.object.searchInput,
        oninput: (e) => model.object.search(e.target.value)
      })
    ]),
  ];
}

/**
 * Create a menu-item for sort-by dropdown
 * @param {Object} model
 * @param {string} shortTitle - title that gets displayed to the user
 * @param {string} title - title that gets displayed to the user on hover
 * @param {Icon} icon
 * @param {string} field - field by which sorting should happen
 * @param {number} order - {-1/1}/{DESC/ASC}
 * @return {vnode}
 */
const sortMenuItem = (model, shortTitle, title, icon, field, order) => h('a.menu-item', {
  title: title, style: 'white-space: nowrap;', onclick: () => model.object.sortTree(shortTitle, field, order, icon)
}, [
  shortTitle, ' ', icon
]);
