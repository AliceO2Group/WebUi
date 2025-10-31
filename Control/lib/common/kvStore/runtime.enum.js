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
 * KV Store paths of components that are to be used during runtime of the application
 * @example 
 * * COG_V1 contains saved configurations for deployments
 * * COG contains further sub-paths for runtime COG specific components
 */
const RUNTIME_COMPONENT = Object.freeze({
  PDP_VERSION: 'aliecs/defaults',
  COG: 'COG',
  COG_V1: 'COG-v1',
});

/**
 * KV Store keys of components that are to be used during runtime of the application
 * @example
 * * RUN_TYPE_TO_HOST_MAPPING contains mapping of run types to hosts that are to be ignored in a deployment
 * * WORKFLOW_MAPPINGS contains mapping of workflow templates to their names
 */
const RUNTIME_KEY = Object.freeze({
  FLP_VERSION: 'flp_suite_version',
  PDP_VERSION: 'pdp_o2pdpsuite_version',
  CALIBRATION_MAPPING: 'calibration-mappings',
  WORKFLOW_MAPPINGS: 'workflow-mappings',
  RUN_TYPE_TO_HOST_MAPPING: 'runType-to-host-mapping'
});

module.exports = {RUNTIME_COMPONENT, RUNTIME_KEY};
