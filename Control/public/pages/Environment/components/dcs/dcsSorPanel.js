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
import { di } from './../../../../utilities/di.js';
import { DetectorStateStyle } from './../../../../common/enums/DetectorState.enum.js';
import { infoLoggerButtonLink } from './../../../../common/buttons/infoLoggerRedirectButton.js';
import { O2Facilities, O2Systems } from '../../../../common/enums/infoLoggerEnums.js';

/**
 * Panel that will display DCS last states during the SOR activity at the start of run
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
    h('.flex-row', [
      h('h4.text-center.flex-grow-1', 'DCS SOR Operations'),
      h('.text-right', [
        infoLoggerButtonLink(
          { partition: id, system: O2Systems.ECS, facility: O2Facilities.CORE_DCS_CLIENT},
          'More in ILG for DCS',
          COG?.ILG_URL ?? ''
        ),
      ]),
    ]),
    h('.grid-container.g2', [
      detectors.map((detector) => {
        const lastStateOfGroupOperations = groupedOperations[detector] ? groupedOperations[detector][groupedOperations[detector].length - 1].state : 'N/A';
        return h('.p1', {
          style: 'flex-grow:1;',
          class: DetectorStateStyle[lastStateOfGroupOperations],
        },[
          h('.f4', {
            style: 'text-decoration-line: underline; font-weight: bold; text-align:center'
          }, detector),
          h('', groupedOperations[detector] ? detectorLastState(groupedOperations[detector]) : 'No operations for this detector')
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
 * Display latest state of DCS for a detector
 * @param {array<object>} operations - list of operations for a detector
 * @return {vnode}
 */
const detectorLastState = (operations) => {
  const lastOperation = operations[operations.length - 1];
  return h('.f6.flex-grow-1.text-center', `${lastOperation.state}`);
};
