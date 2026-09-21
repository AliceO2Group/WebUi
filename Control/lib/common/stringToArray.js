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
 * Convert given string to a list of strings separated by commas or return the array as is.
 * * If the input is a string, it will be split by commas and trimmed of whitespace.
 * * If the input string is empty, it will return an empty array.
 * * If the input is already an array, it will be returned as is.
 * @param {String|Array} dataToConvert - The input data to convert 
 * @returns {Array} - An array of strings
 * @throws {InvalidInputError} - If the input is neither a string nor an array
 */
const stringToArray = (data) => {
  if (typeof data === 'string') {
    if (data.trim() === '') {
      return [] // Return empty array if the string is empty
    }
    return data.split(',').map(item => item.trim()).filter(item => item !== '');
  }
  if (Array.isArray(data)) {
    return data.slice();
  }
  return [];
}
exports.stringToArray = stringToArray;
