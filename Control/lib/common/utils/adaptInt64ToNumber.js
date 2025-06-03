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
 * Method to adapt the int64 value timestamp to a number
 * Value normally comes from a gRPC object and this is needed because the int64 value is not directly compatible with JavaScript's number type.
 * @param {BigInt} int64 - the int64 timestamp to be adapted
 * @return {number} - the adapted timestamp
 */
const adaptInt64ToNumber = (int64) => {
  const bigIntTimestamp = BigInt(int64.toString(10));
  return Number(bigIntTimestamp);
}

exports.adaptInt64ToNumber = adaptInt64ToNumber;
