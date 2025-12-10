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

import { useMutation } from '@tanstack/react-query';
import { useFetchClient } from '~/utils/fetcher';
import {
  banToken,
  createToken,
  filterTokens,
  type TokenCreatePayload,
  type TokenCreateResponse,
  type TokenFilterPayload,
  type TokenFilterResponse,
  type TokenMutationPayload,
  type TokenMutationResponse,
  unbanToken,
} from '../../services/tokenApi';

const tokenMutations = {
  all: ['tokens', 'mutations'] as const,
  ban: () => [...tokenMutations.all, 'ban'] as const,
  unban: () => [...tokenMutations.all, 'unban'] as const,
  filter: () => [...tokenMutations.all, 'filter'] as const,
  create: () => [...tokenMutations.all, 'create'] as const,
};

/**
 *
 */
export default function useTokenActions() {
  const fetchClient = useFetchClient();

  const ban = useMutation<TokenMutationResponse, Error, TokenMutationPayload>({
    mutationKey: tokenMutations.ban(),
    mutationFn: (payload) => banToken(fetchClient, payload),
  });
  const unban = useMutation<TokenMutationResponse, Error, TokenMutationPayload>({
    mutationKey: tokenMutations.unban(),
    mutationFn: (payload) => unbanToken(fetchClient, payload),
  });
  const filter = useMutation<TokenFilterResponse, Error, TokenFilterPayload>({
    mutationKey: tokenMutations.filter(),
    mutationFn: (payload) => filterTokens(fetchClient, payload),
  });
  const create = useMutation<TokenCreateResponse, Error, TokenCreatePayload>({
    mutationKey: tokenMutations.create(),
    mutationFn: (payload) => createToken(fetchClient, payload),
  });

  return {
    ban,
    unban,
    filter,
    create,
  } as const;
}

export const tokenMutationKeys = tokenMutations;
