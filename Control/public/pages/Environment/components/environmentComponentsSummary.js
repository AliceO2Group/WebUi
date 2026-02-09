
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
import { miniCard } from './../../../common/card/miniCard.js';
import loading from './../../../common/loading.js';
import { ALIECS_STATE_COLOR, ALIECS_TRANSITION_COLOR, ODC_STATE_COLOR } from '../../../common/constants/stateColors.js';

const UNKNOWN = 'UNKNOWN';

/**
 * Method to create a panel with the state of critical components of the environments. 
 * * ODC state
 * @param {EnvironmentInfo} environmentInfo - object with information of the environment
 * @returns {vnode} - panel with actions allowed for the user to apply on the environment
 */
export const environmentComponentsSummary = (environmentInfo) => {
  const odcState = environmentInfo?.hardware?.epn?.info?.state ?? UNKNOWN;
  const ddsState = environmentInfo?.hardware?.epn?.info?.ddsSessionStatus	 ?? UNKNOWN;
  const { currentTransition = undefined, state, firstTaskInError } = environmentInfo;

  const odcStateStyle = ODC_STATE_COLOR[odcState] ? `.${ODC_STATE_COLOR[odcState]}` : '';
  const ddsStateStyle = ODC_STATE_COLOR[ddsState] ? `.${ODC_STATE_COLOR[ddsState]}` : '';
  const ecsData = {
    info: currentTransition ? `ECS transition: ${currentTransition}` : `ECS state: ${state}`,
    style: currentTransition
      ? `.${ALIECS_TRANSITION_COLOR[currentTransition] ? ALIECS_TRANSITION_COLOR[currentTransition] : ''}`
      : `.${ALIECS_STATE_COLOR[state] ? ALIECS_STATE_COLOR[state] : ''}`,
  };
  return h('.flex-row.g2', [
    miniCard(_getTitle(currentTransition), [
      h('.flex-column', [
        h(`${ecsData.style}`, ecsData.info),
        h(`${odcStateStyle}`, 'ODC state: ', odcState),
        h(`${ddsStateStyle}`, 'DDS state: ', ddsState),
      ]),
    ]),
    firstTaskInError && miniCard('First Task In Error', [
      _firstTaskInErrorDisplay(firstTaskInError)
    ]),
  ]);
};

/**
 * @private
 * Method to create the title of the panel
 * @param {string} currentTransition - current transition of the environment
 * @returns {vnode} - title of the panel
 */
const _getTitle = (currentTransition) =>
  h('.flex-row.g2', currentTransition
    ? [
      h('', loading(2)),
      h('.flex-column.flex-center', 'Ongoing Activity'),
    ]
    : [
      h('h5.flex-column.flex-center', 'Components State')
    ]
  );

/**
 * @private
 * Method to get the first task in error display, it checks if the event is an ODC device event or a ECS task event and creates the display accordingly
 * @param {TaskEvent | OdcDeviceInfoEvent} taskEvent - the task event with error information
 * @returns {vnode} - display of the task event in case of error
 */
const _firstTaskInErrorDisplay = (taskEvent) => {
  if (taskEvent?.partitionId) {
    return _odcDeviceEventInErrorDisplay(taskEvent);
  } else {
    return _ecsTaskEventInErrorDisplay(taskEvent);
  }
};

/**
 * @private
 * Method to create the display of the task event in case of error
 * @param {TaskEvent} taskEvent - the task event with error information
 * @returns {vnode} - display of the task event in case of error
 */
const _ecsTaskEventInErrorDisplay = (taskEvent = {}) => {
  const { name, hostname, id, status, isCritical } = taskEvent;
  return h(`.flex-column${isCritical ? '.danger' : '.warning'}`, [
    h('span', `ID: ${id}`),
    h('span', `Name: ${name}`),
    h('span', `Host: ${hostname}`),
    h('span', `Status: ${status}`),
  ]);
};

/**
 * @private
 * Method to create the display of the ODC device event in case of error
 * @param {OdcDeviceInfoEvent} odcDeviceEvent - the ODC device event with error information
 * @returns {vnode} - display of the ODC device event in case of error
 */
const _odcDeviceEventInErrorDisplay = (odcDeviceEvent = {}) => {
  const { taskId, hostname, state, path, error } = odcDeviceEvent;
  return h('.flex-column', [
    h('span', `ID: ${taskId}`),
    h('span', `Host: ${hostname}`),
    h('span', `State: ${state}`),
    h('span', `Path: ${path}`),
    h('.danger', `Error: ${error}`)
  ]);
};
