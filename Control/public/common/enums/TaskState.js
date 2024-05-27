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
    if (a === 'ERROR') {
      return -1;
    } else if (b === 'ERROR') {
      return 1;
    } else if (a === 'RUNNING') {
      return -1;
    } else if (b === 'RUNNING') {
      return 1;
    } else if (a === 'CONFIGURED') {
      return -1;
    } else if (b === 'CONFIGURED') {
      return 1;
    } else {
      return a.localeCompare(b);
    }
  });

export const TaskStateClassAssociation = Object.freeze({
  ERROR: '.danger',
  RUNNING: '.success',
  CONFIGURED: '.primary',
  STANDBY: '',
  DONE: '',
  MIXED: '',
  UNKNOWN: '',
  INVARIANT: '',
});
