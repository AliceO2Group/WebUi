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
 * @typedef TaskInfo
 *
 * TaskInfo type definition as parsed and sent to the client by the GUI server
 * The parsing is done based on the object received from ECS in `o2control.proto` definition
 *
 * @property {String} taskId 
 * @property {String} name
 * @property {boolean} locked
 * @property {String} status
 * @property {String} state
 * @property {String} className
 * @property {String} pid
 * @property {String} sandboxStdout
 * @property {boolean} claimable 
 * @property {boolean} critical
 */
