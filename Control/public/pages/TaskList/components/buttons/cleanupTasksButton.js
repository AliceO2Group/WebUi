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
 * Prepares cleanup tasks button in top right corner
 * @param {RemoteData} actionRequest - state of the cleanup resources action request
 */
export const cleanupTasksButton = (actionRequest, onclick) =>
  h('.flex-column.dropdown#flp_selection_info_icon', [
    h(`button.btn.btn-danger`, {
      class: actionRequest.isLoading() ? 'loading' : '',
      disabled: actionRequest.isLoading(),
      onclick: () => confirm(`Are you sure you know what you are doing?`) && onclick(),
    }, 'Clean tasks'),
    h('.p2.dropdown-menu-right#flp_selection_info.text-center', {style: 'width: 350px'},
      'Shutdowns or kills any task that is unlocked and not part of an active environment')
  ]);
