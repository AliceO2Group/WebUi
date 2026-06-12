/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

/**
 * Checks if a run is considered global as per the definition:
 * * trg_enabled is true
 * * trg_global_run_enabled is true
 * @param {JSON} userVars - the user variables present in the environment
 * @param {string} userVars.trg_enabled - indicates if the TRG is enabled
 * @param {string} userVars.trg_global_run_enabled - indicates if the global run
 * @returns {boolean}
 */
export const isGlobalRun = ({trg_enabled, trg_global_run_enabled} = {}) => {
  return trg_enabled === 'true' && trg_global_run_enabled === 'true';
}
