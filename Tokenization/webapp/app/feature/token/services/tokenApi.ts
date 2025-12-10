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

import type { Token } from '../types/token';
import type { Log } from '../types/log';
import type { OptionType } from '~/utils/types';
import { logsMock } from '../mocks/logs';
import { servicesMock } from '~/feature/cert/mocks/services';
import { getMockTokenById, getMockTokens, mockDelay, USE_TOKEN_MOCKS } from '../utils/mock';
import type { FetchClient } from '~/utils/fetcher';

export type TokenFilterPayload = {
  servicesFrom?: string[];
  servicesTo?: string[];
  methods?: string[];
  expirationDateMin?: string;
  expirationDateMax?: string;
  issueDateMin?: string;
  issueDateMax?: string;
  ordering?: string[];
};

export type TokenMutationPayload = {
  tokenId: string;
  filterInfo?: TokenFilterPayload;
};

export type TokenMutationResponse = {
  success: boolean;
  bulk?: boolean;
};

const JSON_HEADERS = {
  'Content-Type': 'application/json',
} as const;

const mutationFallback = (payload: TokenMutationPayload): TokenMutationResponse => ({
  success: true,
  ...(payload.filterInfo ? { bulk: true } : {}),
});

async function getJson<T>(fetchClient: FetchClient, url: string): Promise<T> {
  const response = await fetchClient(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function postJson<T>(fetchClient: FetchClient, url: string, body: unknown, fallback: T): Promise<T> {
  const response = await fetchClient(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const text = await response.text();
  if (!text) {
    return fallback;
  }

  return JSON.parse(text) as T;
}

export async function getTokens(fetchClient: FetchClient): Promise<Token[]> {
  if (USE_TOKEN_MOCKS) {
    await mockDelay();
    return getMockTokens();
  }

  return getJson<Token[]>(fetchClient, '/api/tokens');
}

export async function getToken(fetchClient: FetchClient, tokenId: string): Promise<Token> {
  if (USE_TOKEN_MOCKS) {
    await mockDelay();
    const token = getMockTokenById(tokenId);
    if (!token) {
      throw new Error(`Token with ID ${tokenId} not found`);
    }
    return token;
  }

  return getJson<Token>(fetchClient, `/api/tokens/${tokenId}`);
}

export async function getTokenLogs(fetchClient: FetchClient, tokenId: string): Promise<Log[]> {
  if (USE_TOKEN_MOCKS) {
    await mockDelay();
    return logsMock.get(Number(tokenId)) ?? [];
  }

  return getJson<Log[]>(fetchClient, `/api/tokens/${tokenId}/logs`);
}

export async function getTokenServices(fetchClient: FetchClient): Promise<OptionType[]> {
  if (USE_TOKEN_MOCKS) {
    await mockDelay();
    return servicesMock.map(service => ({
      label: service.service_name,
      value: service.id,
    }));
  }

  const services = await getJson<Array<{ id: string; service_name: string }>>(fetchClient, '/api/services');
  return services.map(service => ({ label: service.service_name, value: service.id }));
}

/**
 * Issues a ban request. Uses the mock responses when enabled.
 */
export async function banToken(fetchClient: FetchClient, payload: TokenMutationPayload): Promise<TokenMutationResponse> {
  if (USE_TOKEN_MOCKS) {
    await mockDelay();
    return mutationFallback(payload);
  }

  return postJson(fetchClient, '/api/tokens/ban', payload, mutationFallback(payload));
}

/**
 * Issues an unban request. Uses the mock responses when enabled.
 */
export async function unbanToken(fetchClient: FetchClient, payload: TokenMutationPayload): Promise<TokenMutationResponse> {
  if (USE_TOKEN_MOCKS) {
    await mockDelay();
    return mutationFallback(payload);
  }

  return postJson(fetchClient, '/api/tokens/unban', payload, mutationFallback(payload));
}

export type TokenFilterResponse = {
  success: boolean;
  filtered: boolean;
  tokens: Token[];
};

function normalizeFilterPayload(payload: TokenFilterPayload): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== '';
    }),
  );
}

function checkIfAnyFilterIsSet(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length > 0;
}

function checkIfOnlyOrderingIsSet(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 1 && Object.prototype.hasOwnProperty.call(obj, 'ordering');
}

/**
 * Executes the filter call, falling back to mock tokens when enabled.
 */
export async function filterTokens(fetchClient: FetchClient, payload: TokenFilterPayload): Promise<TokenFilterResponse> {
  if (USE_TOKEN_MOCKS) {
    await mockDelay();
    const normalized = normalizeFilterPayload(payload);

    if (!checkIfAnyFilterIsSet(normalized) || checkIfOnlyOrderingIsSet(normalized)) {
      return {
        success: true,
        filtered: false,
        tokens: getMockTokens(),
      };
    }

    const tokens = getMockTokens().filter(token => Number(token.id) % 2);
    return {
      success: true,
      filtered: tokens.length > 0,
      tokens,
    };
  }

  return postJson(fetchClient, '/api/tokens/filter', payload, {
    success: true,
    filtered: false,
    tokens: [],
  });
}

export type TokenCreatePayload = {
  fromService: string;
  toService: string;
  methods: string[];
  expirationTime: string;
};

export type TokenCreateResponse = {
  success: boolean;
};

/**
 * Creates a token either via backend or mock response.
 */
export async function createToken(fetchClient: FetchClient, payload: TokenCreatePayload): Promise<TokenCreateResponse> {
  if (!payload.fromService || !payload.toService || payload.methods.length === 0 || !payload.expirationTime) {
    throw new Error('Token creation failed');
  }

  if (USE_TOKEN_MOCKS) {
    await mockDelay();
    return { success: true };
  }

  return postJson(fetchClient, '/api/tokens', payload, { success: true });
}
