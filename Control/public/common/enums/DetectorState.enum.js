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
 * States of a detector as considered by DCS
 * @link https://github.com/AliceO2Group/Control/blob/c5fdca8e25f6f724231d15e34bb1bde7b2c267ab/core/integration/dcs/protos/dcs.proto#L251
 * @return {Object}
 */
export const DetectorState = Object.freeze({
  UNDEFINED: 'UNDEFINED', // GUI initial set state
  NULL_STATE: 'NULL_STATE',
  READY: 'READY',
  RUN_OK: 'RUN_OK',
  RUN_FAILURE: 'RUN_FAILURE',
  RUN_INHIBIT: 'RUN_INHIBIT',
  SOR_PROGRESSING: 'SOR_PROGRESSING',
  EOR_PROGRESSING: 'EOR_PROGRESSING',
  SOR_FAILURE: 'SOR_FAILURE',
  EOR_FAILURE: 'EOR_FAILURE',
  ERROR: 'ERROR',
  DEAD: 'DEAD',
  SOR_UNAVAILABLE: 'SOR_UNAVAILABLE',
  EOR_UNAVAILABLE: 'EOR_UNAVAILABLE',
  PREPARING: 'PREPARING',
  SOR_AVAILABLE: 'SOR_AVAILABLE',
  EOR_AVAILABLE: 'EOR_AVAILABLE',
  PFR_AVAILABLE: 'PFR_AVAILABLE',
  PFR_UNAVAILABLE: 'PFR_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
});
