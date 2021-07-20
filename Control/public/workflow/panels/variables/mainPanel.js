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
 * Custom panel build based on the user
 * to configure the workflow
 * @param {Object} workflow
 * @return {vnode}
 */
export default (workflow) =>
  h('.w-100', [
    h('h5.bg-gray-light.p2.panel-title.w-100.flex-row', h('.w-100', 'Basic Configuration')),
    h('.p2.panel', [
      dcsPanel(workflow),
    ])
  ]);
