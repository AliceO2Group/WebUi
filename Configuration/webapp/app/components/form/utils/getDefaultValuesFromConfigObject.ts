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

import { DEFAULT_PREFIX, KEY_SEPARATOR } from '../constants';
import type { FormValue } from '../types';

/**
 * Get the default values from the configuration object.
 * @param {FormValue | undefined} obj - The configuration object.
 * @param {string} prefix - The prefix of the configuration object.
 * @returns {Record<string, string | number | boolean>} The default values.
 */
export const getDefaultValuesFromConfigObject = (
  obj: FormValue | undefined,
  prefix: string = DEFAULT_PREFIX,
) => {
  if (!obj) {
    return {};
  }
  // omit arrays for now
  if (Array.isArray(obj)) {
    return {};
  }
  let result: Record<string, string | number | boolean> = {};
  const entries = Object.entries(obj);
  for (const [key, value] of entries) {
    const newPrefix = `${prefix}${KEY_SEPARATOR}${key}`;
    if (typeof value === 'object') {
      result = { ...result, ...getDefaultValuesFromConfigObject(value as FormValue, newPrefix) };
    } else {
      if (value === 'true') {
        result[newPrefix] = true;
      } else if (value === 'false') {
        result[newPrefix] = false;
      } else {
        result[newPrefix] = value;
      }
    }
  }
  return result;
};
