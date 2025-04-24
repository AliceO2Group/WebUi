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

import { spinner } from '../../../common/spinner.js';
import { h } from '/js/src/index.js';

/**
 * Build a reusable panel which displays a list of names of service that are currently waiting for their status
 * @param {object} services - Object containing service names as keys and their status
 * @returns {vnode} - A virtual node representing the loading panel
 */
export const servicesLoadingPanel = (services) => {
  if (Object.keys(services).length > 0) {
    const namesAsString = Object.keys(services).join(', ');
    return h('.w-100.flex-row.items-center.p2.shadow-level1', [
      spinner(2),
      h('.ph2', `Loading status for: ${namesAsString.toUpperCase()}`),
    ]);
  }
  return null;
};
