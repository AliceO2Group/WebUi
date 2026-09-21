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
import { filterPanelToggleButton } from '../common/filters/filterViews.js';

/**
 * Shows header for the objects tree page, buttons allow to open/close the entire tree, a search input allow to filter
 * by name.
 * @param {QcObject} qcObject - Model that manages the QCObject state.
 * @param {FilterModel} filterModel - The model handeling the filter state
 * @returns {{centerCol: vnode, rightCol: vnode} | null} - object with vnode elements
 */
export default function objectTreeHeader(qcObject, filterModel) {
  if (!qcObject.currentList) {
    return null;
  }

  const howMany = qcObject.searchInput
    ? `${qcObject.searchResult.length} found of ${qcObject.currentList.length}`
    : `${qcObject.currentList.length} items`;

  return {
    centerCol: h('.flex-grow.text-center.flex-row.justify-center.items-center', [
      h('b.f4', 'Objects'),
      ' ',
      qcObject.objectsRemote.isSuccess() && h('span', `(${howMany})`),
    ]),

    rightCol: h(
      '.w-25.flex-row.items-center.g2.justify-end',
      [filterModel.isRunModeActivated ? null : filterPanelToggleButton(filterModel)],
    ),
  };
}
