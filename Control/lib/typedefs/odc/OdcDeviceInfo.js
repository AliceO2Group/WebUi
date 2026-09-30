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
 * @typedef OdcDeviceInfo
 *
 * OdcDeviceInfo type definition as parsed and sent to the client by the GUI server
 * The parsing is done based on the object received from ODC via ECS
 * This is parsed object by ECS and not the same as the one sent by ODC to ECS. For example:
 * * ODC sends 'id' as uint64 but ECS parses it to 'taskId' as string
 *
 * @property {SourceEventTypes} source - the source of the event, in this case ODC
 * @property {String} taskId - ODC 'id' but renamed by ECS to 'taskId'
 * @property {String} state
 * @property {String} epnState
 * @property {String} path
 * @property {boolean} isIgnored - ODC & ECS 'ignored' but renamed to 'isIgnored' for consistency
 * @property {String} hostname - ODC & ECS 'host' but renamed to 'hostname' for consistency
 * @property {boolean} isExpendable - ODC & ECS 'expendable' but renamed to 'isExpendable' for consistency
 * @property {String} rmsjobid
 * @property {String} className
 */
