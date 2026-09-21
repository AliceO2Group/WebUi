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

/**
 * @typedef {Object} TaskStatus
 * * @property {String} ACTIVE - Task is currently active
 * * @property {String} INACTIVE - Task is currently inactive
 * * @property {String} UNDEFINED - Task status is undefined - Meaning that ECS did not send any status for the task
 */

/**
 * @enum {String}
 * * Enum representing the status of a task in the ECS system.
 */
module.exports.TaskStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  UNDEFINED: 'UNDEFINED', // GUI own declared status for tasks that ECS did not send any status for the task
});
