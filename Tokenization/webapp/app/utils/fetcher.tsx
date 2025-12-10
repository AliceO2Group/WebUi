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

import { useCallback } from 'react';
import { useSession } from '~/feature/auth/hooks/session';

export type FetchClient = (url: string, options?: RequestInit) => Promise<Response>;

/**
 * Low-level fetch wrapper that appends the session token as a query parameter.
 *
 * Notes / constraints:
 * - Only accepts URLs starting with '/api' and will throw otherwise.
 * - This helper obtains the token via useSession(), so it must be invoked from React hook/component
 *   call context (consider refactoring to accept a token param if you want to call it from plain code).
 * - The function does not parse the response; it returns the raw Response object.
 *
 * @returns {(url: string, options?: RequestInit) => Promise<Response>} - memoized fetch client.
 */
export function useFetchClient(): FetchClient {
  const { token } = useSession();

  return useCallback((url: string, options?: RequestInit) => {
    if (!url.startsWith('/api')) {
      throw new Error('Only /api requests are allowed');
    }

    const requestUrl = new URL(url, window.location.origin);
    requestUrl.searchParams.append('token', token ?? '');

    return fetch(requestUrl.toString(), options);
  }, [token]);
}
