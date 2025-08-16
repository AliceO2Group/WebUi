/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

/**
 * @typedef AutoEnvironmentDeployment
 *
 * AutoEnvironmentDeployment type definition for auto transitioning environments which send updates to the GUI via streams
 *
 * @property {String} channelIdString - id of the channel on which updates are sent by AliECS
 * @property {String} detector
 * @property {String} runType
 * @property {Boolean} inProgress - whether the deployment is still in progress
 * @property {Array<TaskEvent|EnvironmentEvent>} events
 */

/**
 * @typedef TaskEvent
 * 
 * Event as sent by AliECS which describes the latest state of a task
 * 
 * @property {String} name
 * @property {String} taskid
 * @property {String} state
 * @property {String} status
 * @property {String} hostname
 * @property {String} className
 * @property {Number} at - date and time at which the event took place
 */

/**
 * @typedef EnvironmentEvent
 * 
 * Event as sent by AliECS which describes the latest state of an environment
 * 
 * @property {String} environmentId
 * @property {'DEPLOYED'|'STANDBY'|'CONFIGURED'|'RUNNING'|'ERROR'|'MIXED'|'SHUTDOWN'} state
 * @property {Number} currentRunNumber
 * @property {String} [error] - only in case of ERROR state
 * @property {String} [message]
 * @property {Number} at - date and time at which the event took place 
 */
