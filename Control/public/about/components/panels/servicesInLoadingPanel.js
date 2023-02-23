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
import loading from '../../../common/loading.js';

/**
 * Build a reusable panel which displays a list of names of service that are currently waiting for their status
 * @param {Array<Service>} names
 * @returns {vnode}
 */
export const servicesInLoadingPanel = (services) => {
  if (Object.keys(services).length > 0) {

    const namesAsString = Object.keys(services).join(', ');
    return h('.w-100.flex-row.items-center.p2.shadow-level1', [
      loading(2),
      h('.ph2', `Loading status for: ${namesAsString}`),
    ]);
  }

}
