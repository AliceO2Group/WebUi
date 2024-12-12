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

/* global COG */

import { h } from '/js/src/index.js';
import { di } from './../../../../utilities/di.js';
import { DetectorStateStyle } from './../../../../common/enums/DetectorState.enum.js';
import { O2Systems, O2Facilities } from './../../../../common/enums/InfoLoggerEnums.js';
import { infoLoggerButtonLink } from './../../../../common/buttons/infoLoggerRedirectButton.js';

/**
 * Panel that will display DCS last states during the SOR activity at the start of run
 * @param {string} id - environment id
 * @param {array<string>} detectors - list of detectors as received by the environment currently displayed in variable `includedDetectors`
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
          'InfoLogger DCS',
          COG?.ILG_URL ?? ''
        ),
      ]),
    ]),
    h('.grid-container.g2', [
      detectors.map((detector) => {
        const lastStateOfGroupOperations = groupedOperations[detector]
          ? groupedOperations[detector][groupedOperations[detector].length - 1].state
          : 'N/A';
        return h('.p1', {
          style: 'flex-grow:1;',
          class: DetectorStateStyle[lastStateOfGroupOperations],
        },[
          h('.f4', {
            style: 'text-decoration-line: underline; font-weight: bold; text-align:center'
          }, detector),
          h('', groupedOperations[detector]
            ? detectorLastState(groupedOperations[detector])
            : 'No operations for this detector')
        ])
      }),
    ])
  ]);
}

/**
 * Group events by detector and filter out events that are arriving after a final event such as
 * some detectors might end the SOR sequence and arrive in RUN_OK, DONE_TIMEOUT, DONE_ERROR state but still recieve from ECS event that if failed.
 * This is incorrect form ECS and should be filtered out.
 * @param {array<object>} operations - list of operations
 * @return {object}
 */
const groupOperationsByDetector = (operations) => {
  const groupedOperations = {};
  operations.forEach((event) => {
    const eventCopy = JSON.parse(JSON.stringify(event));
    eventCopy.detectors.forEach((detector) => {
      if (!groupedOperations[detector]) {
        groupedOperations[detector] = [];
        if (!eventCopy?.state) {
          // first operation might be an error or timeout which comes without a state
          eventCopy.state = eventCopy.operationStepStatus ?? eventCopy.operationStatus;
        }
        groupedOperations[detector].push(eventCopy);
      } else {
        const lastOperation = groupedOperations[detector][groupedOperations[detector].length - 1];
        if (eventCopy.state) {
          // If there is a state, it means it is still an event from DCS
          groupedOperations[detector].push(eventCopy);
        } else if (
          lastOperation?.state !== 'RUN_OK'
          && lastOperation?.state !== 'DONE_TIMEOUT'
          && lastOperation?.state !== 'DONE_ERROR'
        ) {
          // we only add event or step with status DONE_TIMEOUT or DONE_ERROR if the last event state of that detector is SOR_PROGRESSING
          const operationStatus = eventCopy.operationStatus;
          const operationStepStatus = eventCopy.operationStepStatus;
          // priority is given to operationStep as it offers more granularity
          if (operationStepStatus === 'DONE_TIMEOUT' || operationStepStatus === 'DONE_ERROR') {
            eventCopy.state = operationStepStatus;
          } else if (operationStatus === 'DONE_TIMEOUT' || operationStatus === 'DONE_ERROR') {
            eventCopy.state = operationStatus;
          }
          groupedOperations[detector].push(eventCopy);
        }
      }
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
