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
import { VaultImportKeyService } from '../../src/services/VaultImportKeyService';
import type { VaultTransitImportRsaPublicKeyPayload } from '../../src/types/vault_types';

jest.mock('axios');

describe('VaultImportKeyService', () => {
  const agent: any = {};
  let service: VaultImportKeyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VaultImportKeyService();
  });

  it('importKey() sends proper POST request and resolves on success', async () => {
    (axios.post as jest.MockedFunction<typeof axios.post>).mockResolvedValue({
      status: 204,
      data: '',
    } as any);

    const url =
      'https://vault.local:9300/v1/transit/keys/client-01-public-key/import';
    const token = 's.token';

    const body: VaultTransitImportRsaPublicKeyPayload = {
      type: 'rsa-2048',
      public_key:
        '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqh...\n-----END PUBLIC KEY-----\n',
      allow_rotation: false,
      exportable: false,
      allow_plaintext_backup: false,
    };

    await expect(
      service.importKey(url, token, agent, body)
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

  it('importKey() throws error with Vault error message (string)', async () => {
    (axios.post as jest.MockedFunction<typeof axios.post>).mockRejectedValue({
      response: { data: 'permission denied' },
    } as any);

    const url =
      'https://vault.local:9300/v1/transit/keys/client-01-public-key/import';
    const token = 's.token';

    const body: VaultTransitImportRsaPublicKeyPayload = {
      type: 'rsa-2048',
      public_key:
        '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqh...\n-----END PUBLIC KEY-----\n',
    };

    await expect(service.importKey(url, token, agent, body)).rejects.toThrow(
      'permission denied'
    );
  });

  it('importKey() throws stringified error when Vault returns JSON error body', async () => {
    (axios.post as jest.MockedFunction<typeof axios.post>).mockRejectedValue({
      response: { data: { errors: ['invalid key'] } },
    } as any);

    const url =
      'https://vault.local:9300/v1/transit/keys/client-01-public-key/import';
    const token = 's.token';

    const body: VaultTransitImportRsaPublicKeyPayload = {
      type: 'rsa-2048',
      public_key:
        '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqh...\n-----END PUBLIC KEY-----\n',
    };

    await expect(service.importKey(url, token, agent, body)).rejects.toThrow(
      JSON.stringify({ errors: ['invalid key'] })
    );
  });
});
