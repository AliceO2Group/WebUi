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
 * Derive type of value for every key-val pair
 * of given configuration object
 * @param {Object} configuration object we want to get restrictions of
 * @returns {TypeMap} derived restrictions for a given configuration
 */
const computeRestrictions = (value) => {
  const typeMap = {};
  Object.entries(value).forEach(([key, val]) => typeMap[key] = deriveValueType(val));
  return typeMap;
}

/**
 * Derive the type of value and return it as a string
 * possible types are "string", "boolean", "number", "array<`${NestedTypeMap}`>", `${NestedTypeMap}`
 * @param {string | Array | Object} value that we want to get the TypeMap of
 * @returns {string | TypeMap} derived type from the given value, could be a string, or further nested TypeMap
 */
const deriveValueType = (value) => {
  // TODO: implement function _combineTypes, so we can derive Type of value[0] and
  // then combine it with Types of value[1], value[2] and so on to get the overall Type of values held in the array
  if (value instanceof Array) { return "array"; }
  if (value instanceof Object) { return computeRestrictions(value); }
  if (value.toLowerCase() === "true" || value.toLowerCase() === "false") { return "boolean"; }
  if (!Number.isNaN(Number(value))) { return "number"; }
  return "string";
}

exports.computeRestrictions = computeRestrictions;
