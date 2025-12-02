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
import type { FormItem } from '../Form';

/**
 * Get the default values from the configuration object.
 * @param {FormItem | undefined} obj - The configuration object.
 * @param {string} prefix - The prefix of the configuration object.
 * @returns {Record<string, string | number | boolean>} The default values.
 */
export const getDefaultValuesFromConfigObject = (
  obj: FormItem | undefined,
  prefix: string = DEFAULT_PREFIX,
) => {
  if (!obj) {
    return {};
  }
  let result: Record<string, string | number | boolean> = {};
  const entries = Object.entries(obj);
  for (const [key, value] of entries) {
    // omit arrays for now
    if (!isNaN(parseInt(key, 10))) {
      continue;
    }
    const newPrefix = `${prefix}${KEY_SEPARATOR}${key}`;
    if (typeof value === 'object') {
      result = { ...result, ...getDefaultValuesFromConfigObject(value as FormItem, newPrefix) };
    } else {
      result[newPrefix] = value;
    }
  }
  return result;
};
