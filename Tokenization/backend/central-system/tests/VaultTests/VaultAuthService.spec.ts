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
import { VaultAuthService } from '../../src/services/VaultAuthService';

jest.mock('axios');

describe('VaultAuthService', () => {
  const agent: any = {};
  let service: VaultAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VaultAuthService();
  });

  it('login() returns client login token upon success', async () => {
    const fakeToken = 's.fake-token';

    (axios.post as jest.MockedFunction<typeof axios.post>).mockResolvedValue({
      data: { auth: { client_token: fakeToken } },
    } as any);

    const body = JSON.stringify({ name: 'role' });
    const url = 'https://vault.local:9300/v1/auth/cert/login';

    const result = await service.login(url, agent, body);

    expect(axios.post).toHaveBeenCalledWith(url, body, {
      headers: { 'content-type': 'application/json' },
      httpsAgent: agent,
    });
    expect(result).toBe(fakeToken);
  });

  it('login() throws error when response.ok === false', async () => {
    (axios.post as jest.MockedFunction<typeof axios.post>).mockRejectedValue({
      response: { data: 'error' },
    });

    await expect(
      service.login('https://vault.local:9300/v1/auth/cert/login', agent, '{}')
    ).rejects.toThrow('error');
  });

  it('renew() connects with proper token and reutnrs renwed token', async () => {
    const fakeToken = 's.renewed';

    (axios.post as jest.MockedFunction<typeof axios.post>).mockResolvedValue({
      data: { auth: { client_token: fakeToken } },
    } as any);

    const url = 'https://vault.local:9300/v1/auth/token/renew-self';
    const token = 's.old';

    const result = await service.renew(url, token, agent, null);

    expect(axios.post).toHaveBeenCalledWith(url, null, {
      headers: {
        'content-type': 'application/json',
        'X-Vault-Token': token,
      },
      httpsAgent: agent,
    });
    expect(result).toBe(fakeToken);
  });
});
