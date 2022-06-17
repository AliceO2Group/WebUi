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
 * Build a panel with minimal information about the selected object:
 * * lastModified
 * * runNumber
 * @param {Model.js} model 
 * @param {Object} tabObject
 * @returns 
 */
export const minimalObjectInfo = (model, tabObject) => {
  const name = tabObject.name;
  const lastModified = model.object.getLastModifiedByName(name);
  const runNumber = model.object.getRunNumberByName(name);
  return h('.gray-darker.text-center.f6.flex-row.w-100.ph2', {
    style: 'height:3em;justify-content:center;'
  }, [
    h('.w-70', lastModified),
    h('.w-30.text-right', `RunNumber: ${runNumber}`)
  ])
};