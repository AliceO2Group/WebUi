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

export const TaskState = Object.freeze({
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
export const TASK_STATES = Object.values(TaskState)
  .sort((a, b) => {
    
    if (a === TaskState.ERROR_CRITICAL) {
      return -1;
    } else if (b === TaskState.ERROR_CRITICAL) {
      return 1;
    } else if (a === TaskState.ERROR) {
      return -1;
    } else if (b === TaskState.ERROR) {
      return 1;
    } else if (a === TaskState.RUNNING) {
      return -1;
    } else if (b === TaskState.RUNNING) {
      return 1;
    } else if (a === TaskState.CONFIGURED) {
      return -1;
    } else if (b === TaskState.CONFIGURED) {
      return 1;
    } else if (a === TaskState.STANDBY) {
      return -1;
    } else if (b === TaskState.STANDBY) {
      return 1;
    } else {
      return a.localeCompare(b);
    }
  });

/**
 * Given a hardware component task state, return the class associated with the state
 * @param {TaskState} state - task state  to get the class for
 * @return {String} - CSS class to be used in the HTML
 */
export function getTaskStateClassAssociation(state) {
  switch (state) {
    case TaskState.ERROR:
    case TaskState.ERROR_CRITICAL:
      return '.danger';
    case TaskState.RUNNING:
      return '.success';
    case TaskState.CONFIGURED:
      return '.primary';
    default:
      return '';
  }
}
