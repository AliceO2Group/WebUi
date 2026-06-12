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
 * Keys that are used to broadcast information to the user
 */
const BroadcastKeys =  Object.freeze({
  PADLOCK_UPDATE: 'padlock-update',
  NOTIFICATION: 'notification',
  O2_ROC_CONFIG: 'o2-roc-config',
  COMPONENT_STATUS: 'component-STATUS',
  CALIBRATION_RUNS_BY_DETECTOR: 'CALIBRATION_RUNS_BY_DETECTOR',
  CALIBRATION_RUNS_REQUESTS: 'CALIBRATION_RUNS_REQUESTS',
  DCS: {
    SOR: 'DCS.SOR',
  },
  ENVIRONMENT_EVENTS: 'ENVIRONMENT_EVENTS',
  ENVIRONMENTS_OVERVIEW: 'ENVIRONMENTS_OVERVIEW',
  ODC: {
    ENVIRONMENT_STATE_CHANGE: 'ODC_ENVIRONMENT_STATE_CHANGE',
  }
});

exports.BroadcastKeys = BroadcastKeys;
