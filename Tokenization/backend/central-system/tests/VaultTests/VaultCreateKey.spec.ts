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
import { VaultCreateKeyService } from '../../src/services/VaultCreateKeyService';
import type { VaultCreateKeyPayload } from '../../src/interfaces/VaultCreateKeyPayload';

jest.mock('axios');

describe('VaultCreateKeyService', () => {
  const agent: any = {};
  let service: VaultCreateKeyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VaultCreateKeyService();
  });

  it('createKey() sends proper POST request and resolves on success (204)', async () => {
    (axios.post as jest.MockedFunction<typeof axios.post>).mockResolvedValue({
      status: 204,
      data: '',
    } as any);

    const url = 'https://vault.local:9300/v1/transit/keys/my-key';
    const token = 's.token';

    const payload: VaultCreateKeyPayload = {
      type: 'aes256-gcm96',
      convergent_encryption: false,
      derived: false,
      exportable: false,
      allow_plaintext_backup: false,
    };

    const body = JSON.stringify(payload);

    await expect(
      service.createKey(url, token, agent, body)
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

  it('createKey() throws error with Vault error message', async () => {
    (axios.post as jest.MockedFunction<typeof axios.post>).mockRejectedValue({
      response: { data: 'permission denied' },
    });

    const url = 'https://vault.local:9300/v1/transit/keys/my-key';
    const token = 's.token';

    const payload: VaultCreateKeyPayload = {
      type: 'aes256-gcm96',
      convergent_encryption: false,
      derived: false,
      exportable: false,
      allow_plaintext_backup: false,
    };

    const body = JSON.stringify(payload);

    await expect(service.createKey(url, token, agent, body)).rejects.toThrow(
      'permission denied'
    );
  });
});
