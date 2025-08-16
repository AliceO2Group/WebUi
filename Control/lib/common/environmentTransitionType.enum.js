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
 * Available environment transitions as per: https://github.com/AliceO2Group/Control/blob/master/core/protos/o2control.proto#L228
 */
const EnvironmentTransitionType = Object.freeze({
  NOOP: 'NOOP',
  START_ACTIVITY: 'START_ACTIVITY',
  STOP_ACTIVITY: 'STOP_ACTIVITY',
  CONFIGURE: 'CONFIGURE',
  RESET: 'RESET',
  GO_ERROR: 'GO_ERROR',
  DEPLOY: 'DEPLOY',
});

exports.EnvironmentTransitionType = EnvironmentTransitionType;
