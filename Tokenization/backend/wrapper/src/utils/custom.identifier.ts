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
 * Generates a unique identifier string composed of the current timestamp
 * and a random value. The timestamp is represented as a base-36 string
 * and the random value is a base-36 string of four random 32-bit integers.
 * The two values are separated by a hyphen.
 * @returns A unique identifier string.
 */
export const genId = (): string => {
  const time = Date.now().toString(36);
  const rand = Array.from(crypto.getRandomValues(new Uint32Array(4)))
    .map((x) => x.toString(36))
    .join("");
  return `${time}-${rand}`;
};
