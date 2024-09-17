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
import {di} from './../../../../utilities/di.js';

/**
 * Panel that will display DCS SOR operations at the start of run
 * @param {string} id - environment id
 * @param {array<string>} detectors - list of detectors
 * @return {vnode}
 */
export const dcsSorPanel = (id, detectors) => {
  const dcsForEnvironment = di?.cache?.dcs?.sor?.[id] ?? {};

  if (!dcsForEnvironment?.displayCache) {
    return;
  }
  const groupedOperations = groupOperationsByDetector(dcsForEnvironment.dcsOperations);

  return h('.w-100.p1.g2.flex-column', [
    h('h4.text-center', 'DCS SOR Operations'),
      h('.flex-wrap.g2', [
      detectors.map((detector) => {
        return h('', {
          style: 'flex-grow:1'
        },[
          h('label', detector),
          h('pre', groupedOperations[detector] ? detectorOperations(groupedOperations[detector]) : 'No operations for this detector')
        ])
      }),
    ])
  ]);
}

/**
 * Group operations by detector
 * @param {array<object>} operations - list of operations
 * @return {object}
 */
const groupOperationsByDetector = (operations) => {
  const groupedOperations = {};
  operations.forEach((operation) => {
    operation.detectors.forEach((detector) => {
      if (!groupedOperations[detector]) {
        groupedOperations[detector] = [];
      }
      groupedOperations[detector].push(operation);
    });
  });
  return groupedOperations;
};

/**
 * Display operations for a detector with timestamp, name and status
 * @param {array<object>} operations - list of operations for a detector
 * @return {vnode}
 */
const detectorOperations = (operations) => {
  return h('', [
    operations.map((operation) => {
      if (operation.error) {
        return [
          h('.f6.danger', `[${new Date(operation.timestamp).toISOString()}]$${operation.operationStatus}/${operation.operationStep}/${operation.operationStepStatus}`),
          h('.f6.danger', `${operation.error}`),
        ];
      }
      return [
        h('.f6', `[${new Date(operation.timestamp).toISOString()}]$${operation.operationStatus}/${operation.operationStep}/${operation.operationStepStatus}`),
      ];
    })
  ]);
};
