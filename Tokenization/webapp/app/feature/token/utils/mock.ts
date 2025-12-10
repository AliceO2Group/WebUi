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
import { tokensMock } from '../mocks/tokens';

export type RawToken = typeof tokensMock extends Map<number, infer V> ? V : never;

export const USE_TOKEN_MOCKS = import.meta.env.VITE_USE_TOKEN_MOCKS !== 'false';

export const mockDelay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export function normalizeTokenFromMock(token: RawToken): Token {
  return {
    ...token,
    id: String((token as RawToken & { id: string | number }).id),
  } as Token;
}

export function getMockTokens(): Token[] {
  return Array.from(tokensMock.values()).map(normalizeTokenFromMock);
}

export function getMockTokenById(tokenId: string): Token | undefined {
  const raw = tokensMock.get(Number(tokenId));
  if (!raw) {
    return undefined;
  }
  return normalizeTokenFromMock(raw);
}
