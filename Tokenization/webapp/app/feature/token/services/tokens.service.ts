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

import type { Token, TokenLogEntry, TokenStatus } from '~/feature/token/types/token';
import type { TokenFilterValues } from '~/feature/token/types/token-filters';
import type { OptionType } from '~/shared/components/form/multi-select-field';
import { appendTokenParam, buildUrl, createQueryParams, parseJsonOrThrow } from '~/shared/http/http.utils';

export type TokensQueryResponse = {
  tokens: Token[];
  totalCount?: number;
};

/**
 * Appends filter parameters to the query string
 *
 * @param queryString  The URLSearchParams object to append parameters to.
 * @param filters The filter values to append as query parameters.
 */
function appendFilterParams(queryString: URLSearchParams, filters?: TokenFilterValues | null) {
  if (!filters) {
    return;
  }

  if (filters.serviceFrom.length > 0) {
    queryString.append('serviceFrom', filters.serviceFrom.map((service: OptionType) => service.value).join(','));
  }
  if (filters.serviceTo.length > 0) {
    queryString.append('serviceTo', filters.serviceTo.map((service: OptionType) => service.value).join(','));
  }
  if (filters.expiresBefore) {
    queryString.append('expiresBefore', filters.expiresBefore);
  }
  if (filters.expiresAfter) {
    queryString.append('expiresAfter', filters.expiresAfter);
  }
  if (filters.issuedBefore) {
    queryString.append('issuedBefore', filters.issuedBefore);
  }
  if (filters.issuedAfter) {
    queryString.append('issuedAfter', filters.issuedAfter);
  }
  if (filters.ordering.length > 0) {
    queryString.append(
      'ordering',
      filters.ordering.map((order) => `${order.field}:${order.direction}`).join(','),
    );
  }
}

/**
 * Builds the URL for fetching tokens based on provided filters, status, and token.
 *
 * @param filters The filter values to include in the query parameters.
 * @param status The status of the tokens to filter by.
 * @param token The token value to include as a query parameter.
 * @returns The constructed URL string.
 */
function buildTokensUrl(filters: TokenFilterValues | null, status?: TokenStatus, token?: string | null) {
  const queryString = new URLSearchParams();
  if (status) {
    queryString.append('status', status);
  }
  appendFilterParams(queryString, filters);
  appendTokenParam(queryString, token);

  return buildUrl('/api/tokens', queryString);
}

/**
 * Builds a URL scoped to a specific token.
 *
 * @param path The base path for the URL.
 * @param token The token value to include as a query parameter.
 * @returns The constructed URL string.
 */
function buildTokenScopedUrl(path: string, token?: string | null) {
  if (!token) {
    return path;
  }
  return buildUrl(path, createQueryParams(token));
}

/**
 * Fetches tokens based on provided filters and status.
 */
export async function fetchTokens(
  filters: TokenFilterValues | null,
  status?: TokenStatus,
  token?: string | null,
): Promise<TokensQueryResponse> {
  const url = buildTokensUrl(filters, status, token);

  const res = await fetch(url);
  const allTokens = await parseJsonOrThrow<Token[]>(res, 'Fetching tokens');
  return {
    tokens: [...allTokens],
  };
}

/**
 * Returns a single token by its identifier.
 */
export async function fetchTokenById(tokenId: string, token?: string | null): Promise<Token> {
  const url = buildTokenScopedUrl(`/api/tokens/${tokenId}`, token);

  const res = await fetch(url);
  return parseJsonOrThrow<Token>(res, 'Fetching token');
}

/**
 * Fetches the log entries for a specific token.
 */
export async function fetchTokenLogs(tokenId: string, token?: string | null): Promise<TokenLogEntry[]> {
  const url = buildTokenScopedUrl(`/api/tokens/${tokenId}/logs`, token);

  const res = await fetch(url);
  return parseJsonOrThrow<TokenLogEntry[]>(res, 'Fetching token logs');
}

/**
 * Revokes a token by its identifier.
 */
export async function revokeToken(tokenId: string, token?: string | null) {
  const url = buildTokenScopedUrl(`/api/tokens/${tokenId}`, token);

  const res = await fetch(url, {
    method: 'DELETE',
  });
  return parseJsonOrThrow(res, 'Revoking token');
}

/**
 * Revokes tokens in bulk based on filters.
 */
export async function revokeTokensBulk(filters: TokenFilterValues, token?: string | null) {
  const url = buildTokensUrl(filters, 'active', token);

  const res = await fetch(url, {
    method: 'DELETE',
  });
  return parseJsonOrThrow(res, 'Revoking tokens in bulk');
}
