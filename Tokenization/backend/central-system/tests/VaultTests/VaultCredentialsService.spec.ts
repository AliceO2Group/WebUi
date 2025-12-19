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

import { jest } from '@jest/globals';
import axios from 'axios';
import { VaultCredentialsService } from '../../src/services/VaultCredentialsService';
import type {
  VaultKvWritePayload,
  VaultReadResponse,
} from '../../src/types/vault_types';

jest.mock('axios');

describe('VaultCredentialsService', () => {
  const agent: any = {};
  let service: VaultCredentialsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VaultCredentialsService();
  });

  it('getCredential() sends correct GET request and returns VaultReadResponse', async () => {
    const response: VaultReadResponse = {
      data: {
        data: { foo: 'bar', answer: 42 },
        metadata: {
          created_time: '2025-01-01T00:00:00Z',
          custom_metadata: {},
          deletion_time: '',
          destroyed: false,
          version: 1,
        },
      },
    };

    (axios.get as jest.MockedFunction<typeof axios.get>).mockResolvedValue({
      data: response,
    } as any);

    const url = 'https://vault.local:9300/v1/secret/data/db/central-system';
    const token = 's.token';

    const result = await service.getCredential(url, token, agent);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(url, {
      headers: {
        'content-type': 'application/json',
        'X-Vault-Token': token,
      },
      httpsAgent: agent,
    });

    expect(result).toEqual(response);
  });

  it('getCredential() throws error when Vault returns error response', async () => {
    (axios.get as jest.MockedFunction<typeof axios.get>).mockRejectedValue({
      response: { data: 'error' },
    } as any);

    const url = 'https://vault.local:9300/v1/secret/data/db/central-system';
    const token = 's.token';

    await expect(service.getCredential(url, token, agent)).rejects.toThrow(
      'error'
    );
  });

  it('createOrUpdateCredential() sends correct POST request', async () => {
    (axios.post as jest.MockedFunction<typeof axios.post>).mockResolvedValue({
      data: {},
    } as any);

    const url = 'https://vault.local:9300/v1/secret/data/db/central-system';
    const token = 's.token';

    const body: VaultKvWritePayload = {
      data: { foo: 'bar' },
    };

    await expect(
      service.createOrUpdateCredential(url, token, agent, body)
    ).resolves.toBeUndefined();

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(url, body, {
      headers: {
        'content-type': 'application/json',
        'X-Vault-Token': token,
      },
      httpsAgent: agent,
    });
  });

  it('createOrUpdateCredential() throws error when Vault returns error response', async () => {
    (axios.post as jest.MockedFunction<typeof axios.post>).mockRejectedValue({
      response: { data: 'error' },
    } as any);

    const url = 'https://vault.local:9300/v1/secret/data/db/central-system';
    const token = 's.token';

    const body: VaultKvWritePayload = {
      data: { foo: 'bar' },
    };

    await expect(
      service.createOrUpdateCredential(url, token, agent, body)
    ).rejects.toThrow('error');
  });

  it('createOrUpdateCredential() throws stringified error when Vault returns JSON error body', async () => {
    (axios.post as jest.MockedFunction<typeof axios.post>).mockRejectedValue({
      response: { data: { errors: ['permission denied'] } },
    } as any);

    const url = 'https://vault.local:9300/v1/secret/data/db/central-system';
    const token = 's.token';

    const body: VaultKvWritePayload = {
      data: { foo: 'bar' },
    };

    await expect(
      service.createOrUpdateCredential(url, token, agent, body)
    ).rejects.toThrow(JSON.stringify({ errors: ['permission denied'] }));
  });
});
