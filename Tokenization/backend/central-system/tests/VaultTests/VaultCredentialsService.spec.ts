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
import fetch, { Response } from 'node-fetch';
import { VaultCredentialsService } from '../../src/services/VaultCredentialsService';

jest.mock('node-fetch', () => jest.fn());

describe('VaultCredentialsService', () => {
  const agent: any = {};
  let service: VaultCredentialsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VaultCredentialsService();
  });

  it('getCredential() correct GET request with JSON answer', async () => {
    const mockJson = jest
      .fn<() => Promise<{ data: { foo: string; answer: number } }>>()
      .mockResolvedValue({ data: { foo: 'bar', answer: 42 } });

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: mockJson,
    } as unknown as Response);

    const url = 'https://vault.local:9300/v1/secret/data/db/central-system';
    const token = 's.token';

    const result = await service.getCredential(url, token, agent);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(url, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'X-Vault-Token': token,
      },
      agent,
    });

    expect(result).toEqual({
      data: { foo: 'bar', answer: 42 },
    });
  });

  it('getCredential() HTTP error upon ok === false', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      text: jest.fn<() => Promise<string>>().mockResolvedValue('error'),
    } as unknown as Response);

    const url = 'https://vault.local:9300/v1/secret/data/db/central-system';
    const token = 's.token';

    await expect(service.getCredential(url, token, agent)).rejects.toThrow(
      'error'
    );
  });

  it('createOrUpdateCredential() correct POST request', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: jest.fn(),
    } as unknown as Response);

    const url = 'https://vault.local:9300/v1/secret/data/db/central-system';
    const token = 's.token';
    const bodyObj = { data: { foo: 'bar' } };
    const body = JSON.stringify(bodyObj);

    await service.createOrUpdateCredential(url, token, agent, body);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(url, {
      method: 'POST',
      body,
      headers: {
        'content-type': 'application/json',
        'X-Vault-Token': token,
      },
      agent,
    });
  });

  it('createOrUpdateCredential() HTTP error upon ok === false', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      text: jest.fn<() => Promise<string>>().mockResolvedValue('error'),
    } as unknown as Response);

    const url = 'https://vault.local:9300/v1/secret/data/db/central-system';
    const token = 's.token';
    const body = JSON.stringify({ data: { foo: 'bar' } });

    await expect(
      service.createOrUpdateCredential(url, token, agent, body)
    ).rejects.toThrow('error');
  });
});
