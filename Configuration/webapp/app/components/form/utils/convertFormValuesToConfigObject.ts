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

import { KEY_SEPARATOR } from '../constants';
import type { InputsType } from '~/routes/configuration';
import type { FormObjectValue, FormValue } from '../types';

/**
 * Convert flat form values back to nested configuration object format.
 * @param {InputsType} formValues - The flat form values with prefixed keys.
 * @param {string} prefix - The prefix to remove from keys (e.g., '/configuration').
 * @returns {FormValue} The nested configuration object.
 */
export const convertFormValuesToConfigObject = (
  formValues: InputsType,
  prefix: string,
): FormValue => {
  const result: FormValue = {};

  for (const [key, value] of Object.entries(formValues)) {
    if (!key.startsWith(prefix)) {
      continue;
    }

    const keyWithoutPrefix = key.slice(prefix.length);
    const cleanKey = keyWithoutPrefix.startsWith(KEY_SEPARATOR)
      ? keyWithoutPrefix.slice(KEY_SEPARATOR.length)
      : keyWithoutPrefix;

    if (!cleanKey) {
      continue;
    }

    const keys = cleanKey.split(KEY_SEPARATOR).filter((k) => k.length > 0);

    if (keys.length === 0) {
      continue;
    }

    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      const currentKey = keys[i];
      if (!(currentKey in current) || typeof current[currentKey] !== 'object') {
        current[currentKey] = {};
      }
      current = current[currentKey] as FormObjectValue;
    }

    const finalKey = keys[keys.length - 1];
    current[finalKey] = value.toString();
  }

  return result;
};
