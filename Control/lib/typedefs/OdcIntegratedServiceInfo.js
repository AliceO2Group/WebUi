[
  'runNumber',
  'state',
  'ddsSessionId',
  'ddsSessionStatus',
  'devices',
  'hosts'
]
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
 * @typedef OdcIntegratedServiceInfo
 *
 * OdcIntegratedServiceInfo type definition as parsed and sent to the client by the GUI server
 * The parsing is done based on the object received from ECS in integratedServicesData object
 *
 * @property {Number} currentRunNumber
 * @property {String} state
 * @property {String} ddsSessionId
 * @property {String} ddsSessionStatus
 * @property {Array<DeviceInfo>} devices
 * @property {Array<String>} hosts
 */
