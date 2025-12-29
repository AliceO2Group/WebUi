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

import { useSession } from '../feature/auth/hooks/session';

/**
 * Low-level fetch wrapper that appends the session token as a query parameter.
 *
 * Notes / constraints:
 * - Only accepts URLs starting with '/api' and will throw otherwise.
 * - This helper obtains the token via useSession(), so it must be invoked from React hook/component
 *   call context (consider refactoring to accept a token param if you want to call it from plain code).
 * - The function does not parse the response; it returns the raw Response object.
 *
 * @param {string} url - Relative URL; must start with '/api'.
 * @param {RequestInit} [options] - Optional fetch options forwarded to window.fetch.
 * @returns {Promise<Response>} The fetch Response promise.
 * @throws {Error} If the url does not start with '/api'.
 */
export function fetchClient(url: string, options?: RequestInit): Promise<Response> {
  if (!url.startsWith('/api')) {
    throw new Error('Only /api requests are allowed');
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { token } = useSession();
  const _url = new URL(url, window.location.origin);
  _url.searchParams.append('token', token ?? '');

  return fetch(_url.toString(), options);
};
