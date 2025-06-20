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
import { iconCollapseUp, iconArrowBottom, iconArrowTop } from '/js/src/icons.js';
import { filterPanelToggleButton } from '../../../common/filters/filterViews.js';

/**
 * Shows header for the objects tree page, buttons allow to open/close the entire tree, a search input allow to filter
 * by name.
 * @param {QcObject} qcObject - Model that manages the QCObject state.
 * @param {FilterModel} filterModel - The model handeling the filter state
 * @returns {vnode} - virtual node element
 */
export default function objectTreeHeader(qcObject, filterModel) {
  if (!qcObject.currentList) {
    return null;
  }

  const howMany = qcObject.searchInput
    ? `${qcObject.searchResult.length} found of ${qcObject.currentList.length}`
    : `${qcObject.currentList.length} items`;

  return [
    h('.w-33.text-center', [
      h('b.f4', 'Objects'),
      ' ',
      qcObject.objectsRemote.isSuccess() && h('span', `(${howMany})`),
    ]),
    h('.flex-grow.text-right', [
      filterPanelToggleButton(filterModel),
      ' ',
      h('.dropdown', {
        title: 'Sort by', class: qcObject.sortBy.open ? 'dropdown-open' : '',
      }, [
        h('button.btn', {
          title: 'Sort by',
          onclick: () => qcObject.toggleSortDropdown(),
        }, [qcObject.sortBy.title, ' ', qcObject.sortBy.icon]),
        h('.dropdown-menu.text-left', [
          sortMenuItem(qcObject, 'Name', 'Sort by name ASC', iconArrowTop(), 'name', 1),
          sortMenuItem(qcObject, 'Name', 'Sort by name DESC', iconArrowBottom(), 'name', -1),

        ]),
      ]),
      ' ',
      h('button.btn', {
        title: 'Close whole tree',
        onclick: () => model.object.tree.closeAll(),
        disabled: Boolean(model.object.searchInput?.trim()),
      }, iconCollapseUp()),
      ' ',
      h('input.form-control.form-inline.mh1.w-33', {
        placeholder: 'Search',
        type: 'text',
        value: qcObject.searchInput,
        disabled: qcObject.queryingObjects ? true : false,
        oninput: (e) => qcObject.search(e.target.value),
      }),
    ]),
  ];
}

/**
 * Create a menu-item for sort-by dropdown
 * @param {QcObject} qcObject - Model that manages the QCObject state.
 * @param {string} shortTitle - title that gets displayed to the user
 * @param {string} title - title that gets displayed to the user on hover
 * @param {Icon} icon - svg icon to be used
 * @param {string} field - field by which sorting should happen
 * @param {number} order - {-1/1}/{DESC/ASC}
 * @returns {vnode} - virtual node element
 */
const sortMenuItem = (qcObject, shortTitle, title, icon, field, order) => h('a.menu-item', {
  title: title, style: 'white-space: nowrap;', onclick: () => qcObject.sortTree(shortTitle, field, order, icon),
}, [shortTitle, ' ', icon]);
