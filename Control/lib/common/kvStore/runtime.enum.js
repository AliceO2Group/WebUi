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

const RUNTIME_COMPONENT = Object.freeze({
  PDP_VERSION: 'aliecs/defaults',
  COG: 'COG',
  COG_V1: 'COG_V1',
});

const RUNTIME_KEY = Object.freeze({
  FLP_VERSION: 'flp_suite_version',
  PDP_VERSION: 'pdp_o2pdpsuite_version',
  CALIBRATION_MAPPING: 'calibration-mappings',
  RUN_TYPE_TO_HOST_MAPPING: 'runType-to-host-mapping'
});

module.exports = {RUNTIME_COMPONENT, RUNTIME_KEY};
