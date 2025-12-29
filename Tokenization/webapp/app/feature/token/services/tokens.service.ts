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

export type TokensQueryResponse = {
  tokens: Token[];
  totalCount?: number;
};

/**
 *
 */
export async function fetchTokens(
  filters: TokenFilterValues | null,
  status?: TokenStatus,
  token?: string | null,
): Promise<TokensQueryResponse> {
  const queryString = new URLSearchParams();
  if (status) {
    queryString.append('status', status);
  }
  if (filters) {
    if (filters.serviceFrom.length > 0) {
      queryString.append('serviceFrom', filters.serviceFrom.map((service: any) => service.value ).join(','));
    }
    if (filters.serviceTo.length > 0) {
      queryString.append('serviceTo', filters.serviceTo.map((service: any) => service.value ).join(','));
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
      queryString.append('ordering', filters.ordering.map((order) => `${order.field}:${order.direction}`).join(','));
    }
  }
  if (token) {
    queryString.append('token', token);
  }
  
  const query = queryString.toString();
  const url = query ? `/api/tokens?${query}` : '/api/tokens';
  
  const res = await fetch(url);
  const allTokens: Token[] = await res.json();
  return {
    tokens: [...allTokens],
  };
}

/**
 * Returns a single token by its identifier.
 */
export async function fetchTokenById(tokenId: string, token?: string | null): Promise<Token> {
  const params = new URLSearchParams();
  if (token) {
    params.append('token', token);
  }
  const query = params.toString();
  const url = query ? `/api/tokens/${tokenId}?${query}` : `/api/tokens/${tokenId}`;

  const res = await fetch(url);
  const res_token: Token =  await res.json();
  return res_token;
}

export async function fetchTokenLogs(tokenId: string, token?: string | null): Promise<TokenLogEntry[]> {
  const params = new URLSearchParams();
  if (token) {
    params.append('token', token);
  }
  const query = params.toString();
  const url = query ? `/api/tokens/${tokenId}/logs?${query}` : `/api/tokens/${tokenId}/logs`;

  const res = await fetch(url);
  const logs: TokenLogEntry[] =  await res.json();
  return logs;
}

/**
 *
 */
export async function revokeToken(tokenId: string, token?: string | null) {
  const params = new URLSearchParams();
  if (token) {
    params.append('token', token);
  }
  const query = params.toString();
  const url = query ? `/api/tokens/${tokenId}?${query}` : `/api/tokens/${tokenId}`;

  const res = await fetch(url, {
    method: 'DELETE',
  });
  const success = await res.json();
  return success;
}

/**
 *
 */
export async function revokeTokensBulk(filters: TokenFilterValues, token?: string | null) {
  const queryString = new URLSearchParams();

  queryString.append('status', 'active');

  if (filters) {
    if (filters.serviceFrom.length > 0) {
      queryString.append('serviceFrom', filters.serviceFrom.map((service: any) => service.value ).join(','));
    }
    if (filters.serviceTo.length > 0) {
      queryString.append('serviceTo', filters.serviceTo.map((service: any) => service.value ).join(','));
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
      queryString.append('ordering', filters.ordering.map((order) => `${order.field}:${order.direction}`).join(','));
    }
  }
  if (token) {
    queryString.append('token', token);
  }
  
  const query = queryString.toString();
  const url = query ? `/api/tokens?${query}` : '/api/tokens';

  const res = await fetch(url, {
    method: 'DELETE',
  });
  const success = await res.json();
  return success;
}
