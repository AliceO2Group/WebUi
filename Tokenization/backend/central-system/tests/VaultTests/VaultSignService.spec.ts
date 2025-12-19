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
import { VaultSignService } from '../../src/services/VaultSignService';

jest.mock('axios');

describe('VaultSignService', () => {
  const agent: any = {};
  let service: VaultSignService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VaultSignService();
  });

  it('signToken() sends proper transit input and returns signature', async () => {
    const signature = 'vault:v1:abcdef';

    (axios.post as jest.MockedFunction<typeof axios.post>).mockResolvedValue({
      data: { data: { signature } },
    } as any);

    const url = 'https://vault.local:9300/v1/transit/sign/signing-key';
    const token = 's.token';

    const payload = { sub: '123' };
    const input = Buffer.from(JSON.stringify(payload), 'utf8').toString(
      'base64'
    );
    const body = { input };

    const result = await service.signToken(url, token, agent, body);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(url, body, {
      headers: {
        'content-type': 'application/json',
        'X-Vault-Token': token,
      },
      httpsAgent: agent,
    });

    expect(result).toBe(signature);
  });

  it('signToken() throws error when Vault returns error response', async () => {
    (axios.post as jest.MockedFunction<typeof axios.post>).mockRejectedValue({
      response: { data: 'error' },
    } as any);

    const url = 'https://vault.local:9300/v1/transit/sign/signing-key';
    const token = 's.token';

    const payload = { sub: '123' };
    const input = Buffer.from(JSON.stringify(payload), 'utf8').toString(
      'base64'
    );
    const body = { input };

    await expect(service.signToken(url, token, agent, body)).rejects.toThrow(
      'error'
    );
  });

  it('signToken() throws stringified error when Vault returns JSON error body', async () => {
    (axios.post as jest.MockedFunction<typeof axios.post>).mockRejectedValue({
      response: { data: { errors: ['permission denied'] } },
    } as any);

    const url = 'https://vault.local:9300/v1/transit/sign/signing-key';
    const token = 's.token';

    const body = { input: Buffer.from('x', 'utf8').toString('base64') };

    await expect(service.signToken(url, token, agent, body)).rejects.toThrow(
      JSON.stringify({ errors: ['permission denied'] })
    );
  });
});
