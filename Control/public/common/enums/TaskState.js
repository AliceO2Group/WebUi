/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

export const FlpTaskState = Object.freeze({
  ERROR: 'ERROR',
  ERROR_CRITICAL: 'ERROR_CRITICAL', // GUI specific state to distinguish errors
  RUNNING: 'RUNNING',
  STANDBY: 'STANDBY',
  CONFIGURED: 'CONFIGURED',
  DONE: 'DONE',
  MIXED: 'MIXED',
  UNKNOWN: 'UNKNOWN',
  INVARIANT: 'INVARIANT',
});

/**
 * List of possible states for a task sorted alphabetically with ERROR first and RUNNING second and CONFIGURED third
 * @return {Array<String>} list of task states
 */
export const FLP_TASK_STATES = Object.values(FlpTaskState)
  .sort((a, b) => {
    
    if (a === FlpTaskState.ERROR_CRITICAL) {
      return -1;
    } else if (b === FlpTaskState.ERROR_CRITICAL) {
      return 1;
    } else if (a === FlpTaskState.ERROR) {
      return -1;
    } else if (b === FlpTaskState.ERROR) {
      return 1;
    } else if (a === FlpTaskState.RUNNING) {
      return -1;
    } else if (b === FlpTaskState.RUNNING) {
      return 1;
    } else if (a === FlpTaskState.CONFIGURED) {
      return -1;
    } else if (b === FlpTaskState.CONFIGURED) {
      return 1;
    } else if (a === FlpTaskState.STANDBY) {
      return -1;
    } else if (b === FlpTaskState.STANDBY) {
      return 1;
    } else {
      return a.localeCompare(b);
    }
  });

export const EpnTaskState = Object.freeze({
  IDLE: 'IDLE',
  EXITING: 'EXITING',
  RESETTING_DEVICE: 'RESETTING DEVICE',
  INITIALIZING_DEVICE: 'INITIALIZING DEVICE',
  INITIALIZED: 'INITIALIZED',
  BINDING: 'BINDING',
  BOUND: 'BOUND',
  CONNECTING: 'CONNECTING',
  DEVICE_READY: 'DEVICE READY',
  INITIALIZING_TASK: 'INITIALIZING TASK',
  READY: 'READY',
  RUNNING: 'RUNNING',
  RESETTING_TASK: 'RESETTING TASK',
  OK: 'OK',
  ERROR: 'ERROR',
});

/**
 * List of possible states for a task sorted alphabetically with ERROR first and RUNNING second and CONFIGURED third
 * @return {Array<String>} list of task states
 */
export const EPN_TASK_STATES = Object.values(EpnTaskState)
  .sort((a, b) => {
    if (a === EpnTaskState.ERROR) {
      return -1;
    } else if (b === EpnTaskState.ERROR) {
      return 1;
    } else if (a === EpnTaskState.RUNNING) {
      return -1;
    } else if (b === EpnTaskState.RUNNING) {
      return 1;
    } else if (a === EpnTaskState.READY) {
      return -1;
    } else if (b === EpnTaskState.READY) {
      return 1;
    } else if (a === EpnTaskState.IDLE) {
      return -1;
    } else if (b === EpnTaskState.IDLE) {
      return 1;
    } else {
      return a.localeCompare(b);
    }
  });

/**
 * Given a hardware component task state, return the class associated with the state
 * @param {FlpTaskState|EpnTaskState} state - task state  to get the class for
 * @return {String} - CSS class to be used in the HTML
 */
export function getTaskStateClassAssociation(state) {
  switch (state) {
    case FlpTaskState.ERROR:
    case FlpTaskState.ERROR_CRITICAL:
    case EpnTaskState.ERROR:
      return '.danger';
    case FlpTaskState.RUNNING:
    case EpnTaskState.RUNNING:
      return '.success';
    case FlpTaskState.CONFIGURED:
    case EpnTaskState.READY:
      return '.primary';
    default:
      return '';
  }
}
