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
 * Appends the provided token to the URLSearchParams instance if it exists.
 */
export function appendTokenParam(params: URLSearchParams, token?: string | null) {
  if (token) {
    params.append('token', token);
  }
}

/**
 * Returns a new URLSearchParams instance prepared with the optional token.
 */
export function createQueryParams(token?: string | null) {
  const params = new URLSearchParams();
  appendTokenParam(params, token);
  return params;
}

/**
 * Builds a URL by combining the base path with provided search parameters.
 */
export function buildUrl(path: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * Parses a JSON response or throws an Error enriched with backend details.
 */
export async function parseJsonOrThrow<T>(response: Response, context: string): Promise<T> {
  if (!response.ok) {
    let message = `${context} failed. Status: ${response.status}`;

    try {
      const payload = await response.json();
      const detail = payload?.error || payload?.message;
      if (detail) {
        message = `${message} - ${detail}`;
      }
    } catch (error) {
      // ignore JSON parse issues when crafting the error message
    }

    throw new Error(message);
  }

  return response.json();
}
