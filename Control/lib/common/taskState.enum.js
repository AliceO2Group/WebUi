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

module.exports.TaskState = Object.freeze({
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
