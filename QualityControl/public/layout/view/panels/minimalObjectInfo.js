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
 * Build a panel with minimal information about the selected object:
 * * lastModified
 * * runNumber
 * @param {number} runNumber - run number of the object
 * @param {string} lastModified - last modified timestamp of the object
 * @returns {vnode} - virtual node element
 */
export const minimalObjectInfo = (runNumber, lastModified) => h('.w-100.p1.gray-darker.f6.flex-row', [
  h('.flex-grow.text-left', lastModified),
  h('.text-right', `RunNumber: ${runNumber}`),
]);
