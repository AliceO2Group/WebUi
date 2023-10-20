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
 * Levels are defined as per InfoLogger API: https://github.com/AliceO2Group/InfoLogger/blob/master/doc/README.md#api-for-developers 
 */
const LOG_LEVEL = Object.freeze({
  OPERATIONS: 5,
  SUPPORT: 10,
  DEVELOPER: 20,
  TRACE: 99
});

exports.LOG_LEVEL = LOG_LEVEL;
