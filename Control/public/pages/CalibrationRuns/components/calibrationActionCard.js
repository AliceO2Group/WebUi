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

import { h, iconPlayCircle, RemoteData } from '/js/src/index.js';
import { miniCard } from './../../../common/card/miniCard.js';
import pageLoading from './../../../common/pageLoading.js';
import errorComponent from './../../../common/errorComponent.js';
import { ALIECS_STATE_COLOR } from './../../../common/constants/stateColors.js';
import { getTaskShortName } from './../../../common/utils.js';

/**
 * Builds a card with information and actions allowed on that type of run calibration for that detector
 * @param {CalibrationConfiguration} calibrationConfiguration - information about the run
 * @param {RemoteData<RunSummary.Error>} ongoingCalibrationRun - information on ongoing calibration run
 * @param {string} detector - to which the run belongs to
 * @param {Function} onclick - action to trigger when clicking on button
 * @returns {vnode}
 */
export const calibrationActionCard = (calibrationConfiguration, ongoingCalibrationRun, detector, onclick) => {
  const { runType, configuration, label, description = '' } = calibrationConfiguration;
  if (!ongoingCalibrationRun?.kind) {
    ongoingCalibrationRun = RemoteData.success(ongoingCalibrationRun);
  }

  const inProgress = Boolean(ongoingCalibrationRun.isLoading() || ongoingCalibrationRun?.payload?.inProgress);
  const title = inProgress ?
    'A calibration run for this detector is already in progress'
    : `Start a calibration run for ${detector} with run type ${runType}`;
  return miniCard(h('.flex-column', [
    h('.flex-row.justify-between', [
      h('.flex-row.gc1', [
        h('button.btn.btn-sm.btn-success', {
          disabled: inProgress,
          onclick: () => onclick(detector, runType, configuration),
          title,
        }, inProgress ? pageLoading(1) : iconPlayCircle()),
        h('strong', label),
      ]),
      h('small', `${configuration}`),
    ]),
    h('small', h('em', description)),
  ]), [
    ongoingCalibrationRun && ongoingCalibrationRun.match({
      NotAsked: () => null,
      Loading: () => null,
      Success: (result) => calibrationEventsDisplay(result?.events),
      Failure: (error) => errorComponent(error),
    }),
  ], ['w-40', 'g0', 'gr1', 'p1']);
};

/**
 * Build a panel for displaying events in reverse order that took place during the deployment of the environment
 * @param {Array<AutoEnvironmentDeployment.Event>} events - that took place during the deployment
 * @returns {vnode}
 */
const calibrationEventsDisplay = (events = []) => {
  const eventsReversed = JSON.parse(JSON.stringify(events)).reverse();
  return h('.flex-column.scroll-y', {
    style: 'max-height: 7em',
  }, [
    eventsReversed?.map(({ type, payload }) => {
      if (type === 'ENVIRONMENT') {
        return environmentEventDisplay(payload);
      } else if (type === 'TASK') {
        return taskEventDisplay(payload);
      } else {
        return h('', JSON.stringify(payload));
      }
    }),
  ]);
};

/**
 * Given an event of type ENVIRONMENT, build a line with user readable information
 * @param {AutoEnvironmentDeployment.EnvironmentEvent} event
 * @returns {vnode}
 */
const environmentEventDisplay = (event) => {
  const { at, environmentId, state, currentRunNumber, error, message } = event;
  const classList = [];

  let lineMessage = `[${at ? new Date(at).toLocaleString() : '-'}] `;
  if (environmentId) {
    lineMessage += `ID: ${environmentId}`;
  }
  if (state) {
    lineMessage += ` is ${state}`;
    if (ALIECS_STATE_COLOR[state]) {
      classList.push(ALIECS_STATE_COLOR[state]);
    }
  }

  if (currentRunNumber) {
    lineMessage += ` with run ${currentRunNumber}`;
  }
  if (error) {
    lineMessage += ` due to ${error}`;
    classList.push('danger');
  }
  if (message) {
    lineMessage += `: ${message}`;
  }
  return h('small', { classList: classList.join(' ') }, lineMessage);
};

/**
 * Given an event of type TASK, build a line with user readable information
 * @param {AutoEnvironmentDeployment.EnvironmentEvent} event
 */
const taskEventDisplay = (event) => {
  const { at, name, taskId, state, status, hostname, message } = event;
  const classList = [];

  let lineMessage = `[${at ? new Date(at).toLocaleString() : '-'}] `;
  if (name) {
    lineMessage += `Task: ${getTaskShortName(name)}`;
  }
  if (taskId) {
    lineMessage += ` with id: ${taskId}`;
  }
  if (state) {
    lineMessage += ` has state: ${state}`;
    if (ALIECS_STATE_COLOR[state]) {
      classList.push(ALIECS_STATE_COLOR[state]);
    }
  }
  if (status) {
    lineMessage += ` has status: ${status}`;
  }
  if (hostname) {
    lineMessage += ` running on: ${hostname}`;
  }
  if (message) {
    lineMessage += `: ${message}`;
  }
  return h('small', { classList: classList.join(' ') }, lineMessage);
};
