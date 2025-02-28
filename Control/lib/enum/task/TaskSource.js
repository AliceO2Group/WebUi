/**
 * @license
 * Copyright 2019-2024 CERN and copyright holders of ALICE O2.
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
 * An enumeration of task sources available in an environment
 * @return {Object}
 */
exports.TaskSource = Object.freeze({
  ALL: 'ALL',
  EPN: 'EPN',
  FLP: 'FLP',
  QC: 'QC',
  TRG: 'TRG',
});
