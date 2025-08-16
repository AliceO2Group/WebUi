
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
 * Check if variable is known and if yes return a user readable name for that variable
 * Otherwise return the variable itself;
 * @param {string} variable - variable key
 * @return {string} - user readable name for the variable
 */
export const getKnownVariableLabel = (variable) => {
  switch (variable) {
    case 'dcs_enabled':
      return 'DCS'
    case 'odc_enabled':
      return 'EPN';
    case 'qcdd_enabled':
      return 'General QC (FLP)';
    case 'dd_enabled':
      return 'Data Distribution';
    case 'ddsched_enabled':
      return 'Data Distribution Scheduler'
    case 'minimal_dpl_enabled':
      return 'Minimal DPL workflow';
    case 'readout_cfg_uri':
      return 'Readout URI';
    case 'qc_config_uri':
      return 'QC URI';
    default:
      return variable;
  }
};
