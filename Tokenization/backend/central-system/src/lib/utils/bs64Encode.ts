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

const toB64Url = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const toB64Std = (s: string) => Buffer.from(s, "utf8").toString("base64");

/**
 * @description Helper function to build the base64url and base64 standard encoded inputs for transit token generation.
 */
export function buildTransitInput(
  header: Record<string, unknown>,
  payload: Record<string, unknown>
): { input: string; signingInput: string } {
  const protectedB64u = toB64Url(JSON.stringify(header));
  const payloadB64u = toB64Url(JSON.stringify(payload));
  const signingInput = `${protectedB64u}.${payloadB64u}`;
  const input = toB64Std(signingInput);
  return { input, signingInput };
}
