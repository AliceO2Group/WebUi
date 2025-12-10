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

import { tokensMock } from '../mocks/tokens';

// Will be used to fetch filtered tokens
/**
 *
 */
export async function clientAction({ request }: any) {

  const formData = await request.formData();

  // Convert FormData -> plain object
  const raw: Record<string, any> = {};
  for (const key of formData.keys()) {
    const values = formData.getAll(key);
    raw[key] = values.length > 1 ? values : values[0];
  }

  // Normalize values: our select components serialize values as JSON strings in hidden inputs,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tryParse = (val: any) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  };

  // If element is array, parse each item; else parse single value
  const normalized: Record<string, object> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (Array.isArray(v)) {
      normalized[k] = v.map(tryParse);
    } else {
      normalized[k] = tryParse(v);
    }
  }
  
  // eslint-disable-next-line no-console
  console.log('Filtering tokens with data:', normalized);

  // Remove empty values.
  const isEmptyValue = (v: any) => {
    if (v == null) {
      return true;
    } // Removing nulls
    if (Array.isArray(v)) { // Removing empty arrays
      return v.filter((x) => x != null && x !== '' && !(Array.isArray(x) && x.length === 0)).length === 0;
    }
    return v === ''; // Removing empty strings
  };

  const data = Object.fromEntries(
    Object.entries(normalized).filter(([_, v]) => !isEmptyValue(v)),
  );

  /**
   *
   */
  function checkIfAnyFilterIsSet(obj: Record<string, any>): boolean {
    if (Object.keys(obj).length === 0) {
      return false;
    }
    return true;
  }

  /**
   *
   */
  function checkIfOnlyOrderingIsSet(obj: Record<string, any>): boolean {
    if (Object.keys(obj).length === 1) {
      if (Object.keys(obj)[0] === 'orderBy') {
        return true;
      }
    }
    return false;
  }

  // Not filters are set so we return all tokens
  if (!checkIfAnyFilterIsSet(data)) {
    const tokens = Array.from(tokensMock.values());
    return { success: true, filtered: false, tokens: tokens };
  }

  // This situation will not let user to bulk operate
  if (checkIfOnlyOrderingIsSet(data)) {
    const tokens = Array.from(tokensMock.values());
    return { success: true, filtered: false, tokens: tokens };
  }

  const tokens = Array.from(tokensMock.values()).filter(token => token.id % 2 ); // We add some filtering mock
  return { success: true, filtered: true, tokens: tokens };
}
