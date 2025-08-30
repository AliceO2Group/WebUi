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
 * Prepares cleanup resources button in top right corner
 * @param {RemoteData} actionRequest - state of the cleanup resources action request
 * @param {boolean} isDetectorAndHostListLoaded - Flag indicating if detector and host list is loaded
 * @param {Function} onclick - Callback function to call when the button is clicked
 */
export const cleanupResourcesButton = (actionRequest, isDetectorAndHostListLoaded = false, onclick) =>
  h('.flex-column.dropdown#flp_selection_info_icon', [
    h(`button.btn.btn-warning`, {
      class: actionRequest.isLoading() ? 'loading' : '',
      disabled: actionRequest.isLoading() || !isDetectorAndHostListLoaded,
      onclick: () => confirm(`Are you sure you know what you are doing?`) && onclick(),
    }, 'Clean resources'),
    h('.p2.dropdown-menu-right#flp_selection_info.text-center', {style: 'width: 500px'}, [
      h('', `It runs 'roc-cleanup' and 'fairmq-shmmonitor -c' to clean RAM and disk resources, including SHM files.`),
      h('', `It does nothing to tasks.`)
    ])
  ]);
