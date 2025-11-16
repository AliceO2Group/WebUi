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

import React, { useEffect } from 'react';
import { useSession } from './session';

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
  const { token } = useSession();
  const _url = new URL(url, window.location.origin);
  _url.searchParams.append('token', token || '');

  return fetch(_url.toString(), options);
};

/**
 * React hook for fetching JSON from REST API endpoints under '/api'.
 *
 * Behavior and expectations:
 * - This hook calls fetchClient which appends the session token as a 'token' query param.
 * - The hook performs a single fetch on mount (empty dependency array).
 * - The hook expects the endpoint to return JSON and calls res.json(). If the response is not valid JSON,
 *   res.json() will throw and the error will be surfaced via the `error` return value.
 * - Designed for fetching REST JSON endpoints under '/api' only.
 *
 * Caveats:
 * - If you need different behavior (retries, polling, conditional fetches, non-JSON responses),
 *   consider extending or replacing this hook.
 * - Because fetchClient currently uses useSession(), ensure calls follow React Hooks rules.
 *
 * @param {string} url - Relative URL to fetch; must start with '/api'.
 * @param {RequestInit} [options] - Optional fetch options forwarded to fetchClient/window.fetch.
 * @returns {{ data: object|null, loading: boolean, error: Error|null }} Hook state:
 *   - data: parsed JSON result or null
 *   - loading: whether request is in progress
 *   - error: error object if fetch or JSON parsing failed
 */
export function useFetching(url: string, options?: RequestInit) {
  // Adds token to url
  const fetcher = fetchClient(url, options);
  // Logic for managing fetch state
  const [data, setData] = React.useState<object | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);

  useEffect(() => {
    let unmounted = false;
    setLoading(true);
    fetcher
      .then(res => res.json())
      .then(res => {
        if (!unmounted) {
          setData(res);
          setLoading(false);
        }
      }).catch(err => {
        if (!unmounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      // Happens after component unmounts
      unmounted = true;
    };
  }, []);

  return { data, loading, error };
}
