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

import { mockArchivedTokenLogs, mockActiveTokenLogs } from '~/feature/token/mocks/token-logs.mock';
import { mockTokens } from '~/feature/token/mocks/tokens.mock';
import type { Token, TokenLogEntry, TokenStatus } from '~/feature/token/types/token';
import type { TokenFilterValues } from '~/feature/token/types/token-filters';

export type TokensQueryResponse = {
  tokens: Token[];
};

/**
 *
 */
export async function fetchTokens(filters: TokenFilterValues | null, status?: TokenStatus): Promise<TokensQueryResponse> {
  const scopedTokens = status ? mockTokens.filter((token) => token.status === status) : mockTokens;
  return {
    tokens: [...scopedTokens],
  };
}

/**
 * Returns a single token by its identifier.
 */
export async function fetchTokenById(tokenId: string): Promise<Token> {
  const token = mockTokens.find((item) => item.tokenId === tokenId);
  if (!token) {
    throw new Error('Token not found');
  }
  return token;
}

export async function fetchTokenLogs(tokenId: string): Promise<TokenLogEntry[]> {
  if (mockActiveTokenLogs[tokenId]) {
    return mockActiveTokenLogs[tokenId];
  }
  if (mockArchivedTokenLogs[tokenId]) {
    return mockArchivedTokenLogs[tokenId];
  }
  return [];
}

/**
 *
 */
export async function revokeToken(tokenId: string) {
  return { tokenId };
}

/**
 *
 */
export async function revokeTokensBulk(filters: TokenFilterValues) {
  return { count: mockTokens.length };
}
