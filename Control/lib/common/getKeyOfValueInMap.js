/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

/**
 * Given a map and a value, return the key that contains the value
 * @param {Map<String, Array<String>>} map - a map with keys and values
 * @param {String} value - a value to search for in the map
 * @return {String} - the key that contains the value
 */
exports.getKeyOfValueInMap = (map, value) => {
  for (const [key, values] of map.entries()) {
    if (values.includes(value)) {
      return key;
    }
  }
  return null;
};
