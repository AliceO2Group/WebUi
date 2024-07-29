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
 * States of an environment
 * @link https://github.com/AliceO2Group/Control/blob/c5fdca8e25f6f724231d15e34bb1bde7b2c267ab/core/integration/dcs/protos/dcs.proto#L251
 * @return {Object}
 */
export const EnvironmentState = Object.freeze({
  STANDBY: 'STANDBY',
  DEPLOYED: 'DEPLOYED',
  CONFIGURED: 'CONFIGURED',
  RUNNING: 'RUNNING',
  ERROR: 'ERROR',
  UNKNOWN: 'UNKNOWN'
});
