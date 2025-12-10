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

import type { ArrayRestrictions, ObjectRestrictions, Restrictions } from '.';

/**
 * Function which returns true only if the given argument is an ObjectRestrictions object itself
 * @param {Restrictions} value the object which describes the Restrictions
 * @returns {boolean} true if value given is an ObjectRestrictions object
 */
export function isObjectRestrictions(value: Restrictions): value is ObjectRestrictions {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Function which returns true only if the given argument is an ArrayRestrictions array itself
 * @param {Restrictions} value the object which describes the Restrictions
 * @returns {boolean} true if value given is an ArrayRestrictions object
 */
export function isArrayRestrictions(value: Restrictions): value is ArrayRestrictions {
  return Array.isArray(value);
}
