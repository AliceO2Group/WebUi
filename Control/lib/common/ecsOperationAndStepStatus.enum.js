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
 * Available ECS Statuses of operations for Kafka Events
 * https://github.com/AliceO2Group/Control/blob/master/core/protos/o2control.proto#L228
 * These operations can be under the label:
 * * operationStatus
 * * operationStepStatus
 */
const EcsOperationAndStepStatus = Object.freeze({
  NULL: 'NULL',
  STARTED: 'STARTED',
  ONGOING: 'ONGOING',
  DONE_OK: 'DONE_OK',
  DONE_ERROR: 'DONE_ERROR',
  DONE_TIMEOUT: 'DONE_TIMEOUT',
});

exports.EcsOperationAndStepStatus = EcsOperationAndStepStatus;
