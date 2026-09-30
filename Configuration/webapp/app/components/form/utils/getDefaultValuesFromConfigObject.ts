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
import { isPrimitiveValue } from '../types/helpers';

/**
 * Get the default values from the configuration object.
 * @param {FormValue} val - The configuration value.
 * @param {string} prefix - The prefix of the configuration object.
 * @returns {Record<string, string | number | boolean>} The default values.
 */
export const getDefaultValuesFromConfigObject = (
  val: FormValue | undefined,
  prefix: string = DEFAULT_PREFIX,
) => {
  if (val === undefined) {
    return {};
  }

  if (isPrimitiveValue(val)) {
    if (val === 'true') {
      return { [prefix]: true };
    }
    if (val === 'false') {
      return { [prefix]: false };
    }
    return { [prefix]: val };
  }

  let result: Record<string, string | number | boolean> = {};
  const entries = Object.entries(val);
  for (const [key, value] of entries) {
    const newPrefix = `${prefix}${KEY_SEPARATOR}${key}`;
    result = { ...result, ...getDefaultValuesFromConfigObject(value, newPrefix) };
  }

  // this is an exception where the empty object / empty array is the leaf
  // of the Configuration Form tree, because it is empty
  // however we still need to render that in the UI, so this bit of info needs to be present
  if (entries.length === 0) {
    const emptyPrefix = `${prefix}${KEY_SEPARATOR}`;
    // bypass typescript since this is an exception from the usual logic of the application
    result = { [emptyPrefix]: val as unknown as string };
  }

  return result;
};
