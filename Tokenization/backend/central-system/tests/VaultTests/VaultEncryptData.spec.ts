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
import { EncryptionService } from '../../src/services/EncryptionService';
import type { VaultEncryptPayload } from '../../src/types/vault_types';

jest.mock('axios');

describe('EncryptionService', () => {
  const agent: any = {};
  let service: EncryptionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EncryptionService();
  });

  it('encryptData() sends proper request and returns ciphertext', async () => {
    const ciphertext = 'vault:v1:XjsPWPjqPrBi1N2Ms2s1QM798YyFWnO4TR4lsFA=';

    (axios.post as jest.MockedFunction<typeof axios.post>).mockResolvedValue({
      data: { data: { ciphertext } },
    } as any);

    const url = 'https://vault.local:9300/v1/transit/encrypt/my-key';
    const token = 's.token';

    const plaintextB64 = Buffer.from('the quick brown fox', 'utf8').toString(
      'base64'
    );
    const body: VaultEncryptPayload = { plaintext: plaintextB64 };

    const result = await service.encryptData(url, token, agent, body);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(url, body, {
      headers: {
        'content-type': 'application/json',
        'X-Vault-Token': token,
      },
      httpsAgent: agent,
    });

    expect(result).toBe(ciphertext);
  });

  it('encryptData() throws error with Vault error message', async () => {
    (axios.post as jest.MockedFunction<typeof axios.post>).mockRejectedValue({
      response: { data: 'permission denied' },
    } as any);

    const url = 'https://vault.local:9300/v1/transit/encrypt/my-key';
    const token = 's.token';

    const plaintextB64 = Buffer.from('the quick brown fox', 'utf8').toString(
      'base64'
    );
    const body: VaultEncryptPayload = { plaintext: plaintextB64 };

    await expect(service.encryptData(url, token, agent, body)).rejects.toThrow(
      'permission denied'
    );
  });

  it('encryptData() throws stringified error when Vault returns JSON error body', async () => {
    (axios.post as jest.MockedFunction<typeof axios.post>).mockRejectedValue({
      response: { data: { errors: ['invalid base64'] } },
    } as any);

    const url = 'https://vault.local:9300/v1/transit/encrypt/my-key';
    const token = 's.token';

    const body: VaultEncryptPayload = { plaintext: '!!!' };

    await expect(service.encryptData(url, token, agent, body)).rejects.toThrow(
      JSON.stringify({ errors: ['invalid base64'] })
    );
  });
});
