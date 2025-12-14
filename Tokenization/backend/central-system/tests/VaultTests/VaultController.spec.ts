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
import { VaultController } from '../../src/controllers/VaultController';
import { EventType } from '../../src/lib/utils/events';
import { registerBusHandler } from '../../src/lib/event-bus/register-bus-handler';

jest.mock('../../src/lib/event-bus/register-bus-handler', () => ({
  registerBusHandler: jest.fn(),
}));

const b64 = (s: string) => Buffer.from(s).toString('base64');

describe('VaultController', () => {
  let tokenSignService: any;
  let authService: any;
  let credentialsService: any;
  let createKeyService: any;
  let encryptionService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // env for Vault
    process.env.VAULT_ADDR = 'https://vault.local:9300';
    process.env.VAULT_AUTH_METHOD = 'cert';
    process.env.VAULT_ROLE = 'central-system';

    process.env.VAULT_CACERT_B64 = b64('CA');
    process.env.VAULT_CENTRAL_SYSTEM_CERT_B64 = b64('CERT');
    process.env.VAULT_CENTRAL_SYSTEM_KEY_B64 = b64('KEY');

    tokenSignService = {
      signToken: jest
        .fn<() => Promise<string>>()
        .mockResolvedValue('signedToken'),
    };

    authService = {
      login: jest.fn<() => Promise<string>>().mockResolvedValue('s.token'),
      renew: jest
        .fn<() => Promise<string>>()
        .mockResolvedValue('s.token-renewed'),
    };

    credentialsService = {
      getCredential: jest
        .fn<() => Promise<{ data: { foo: string } }>>()
        .mockResolvedValue({ data: { foo: 'bar' } }),
      createOrUpdateCredential: jest
        .fn<() => Promise<void>>()
        .mockResolvedValue(undefined),
    };

    encryptionService = {
      encryptData: jest
        .fn<() => Promise<string>>()
        .mockResolvedValue('ciphertext'),
    };

    createKeyService = {
      createKey: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };
  });

  test('missing TLS env vars', () => {
    delete process.env.VAULT_CACERT_B64;

    expect(
      () =>
        new VaultController(
          tokenSignService,
          authService,
          credentialsService,
          encryptionService,
          createKeyService
        )
    ).toThrow('Missing required environment variables for TLS certificates.');
  });

  test('loginVault() authService.login with proper body and URL', async () => {
    const controller = new VaultController(
      tokenSignService,
      authService,
      credentialsService,
      encryptionService,
      createKeyService
    );

    await controller.loginVault();

    expect(authService.login).toHaveBeenCalledTimes(1);
    const [url, agent, body] = authService.login.mock.calls[0];

    expect(url).toBe('https://vault.local:9300/v1/auth/cert/login');
    expect(typeof agent).toBe('object');
    expect(JSON.parse(body as string)).toEqual({ name: 'central-system' });
  });

  test('signToken() uses Vault login token and proper URL', async () => {
    const controller = new VaultController(
      tokenSignService,
      authService,
      credentialsService,
      encryptionService,
      createKeyService
    );

    await controller.loginVault();

    const dataToBeSigned = { sub: '123', foo: 'bar' };
    const input = Buffer.from(JSON.stringify(dataToBeSigned), 'utf8').toString(
      'base64'
    );

    const payload = { input };

    const result = await controller.signToken(payload as any);

    expect(tokenSignService.signToken).toHaveBeenCalledTimes(1);
    const [url, token, agent, body] = tokenSignService.signToken.mock.calls[0];

    expect(url).toBe(
      'https://vault.local:9300/v1/transit/sign/tokenization-signing'
    );
    expect(token).toBe('s.token');
    expect(typeof agent).toBe('object');

    expect(body).toBe(JSON.stringify(payload));

    expect(result).toBe('signedToken');
  });

  test('getCredentialFromVault() creates proper URL and returns service output', async () => {
    const controller = new VaultController(
      tokenSignService,
      authService,
      credentialsService,
      encryptionService,
      createKeyService
    );

    (controller as any)._vaultAccessToken = 's.token';

    const path = 'db/central-system';
    const result = await controller.getCredentialFromVault(path);

    expect(credentialsService.getCredential).toHaveBeenCalledTimes(1);
    const [url, token, agent] = credentialsService.getCredential.mock.calls[0];

    expect(url).toBe(
      'https://vault.local:9300/v1/tokenization/data/db/central-system'
    );
    expect(token).toBe('s.token');
    expect(typeof agent).toBe('object');
    expect(result).toEqual({ data: { foo: 'bar' } });
  });

  test('createOrUpdateCredentialInVault() calls createOrUpdateCredential with proper parameters', async () => {
    const controller = new VaultController(
      tokenSignService,
      authService,
      credentialsService,
      encryptionService,
      createKeyService
    );

    (controller as any)._vaultAccessToken = 's.token';

    const path = 'db/central-system';
    const bodyObj = { data: { foo: 'bar' } };

    await controller.createOrUpdateCredentialInVault(path, bodyObj);

    expect(credentialsService.createOrUpdateCredential).toHaveBeenCalledTimes(
      1
    );
    const [url, token, agent, body] =
      credentialsService.createOrUpdateCredential.mock.calls[0];

    expect(url).toBe(
      'https://vault.local:9300/v1/tokenization/data/db/central-system'
    );
    expect(token).toBe('s.token');
    expect(typeof agent).toBe('object');
    expect(JSON.parse(body as string)).toEqual(bodyObj);
  });

  test('encryptData() uses Vault login token, proper URL and stringified body', async () => {
    const controller = new VaultController(
      tokenSignService,
      authService,
      credentialsService,
      encryptionService,
      createKeyService
    );

    await controller.loginVault();

    const key = 'my-key';
    const bodyObj = { plaintext: 'dGhlIHF1aWNrIGJyb3duIGZveAo=' };

    const result = await controller.encryptData(key, bodyObj as any);

    expect(encryptionService.encryptData).toHaveBeenCalledTimes(1);
    const [url, token, agent, body] =
      encryptionService.encryptData.mock.calls[0];

    expect(url).toBe(`https://vault.local:9300/v1/transit/encrypt/${key}`);
    expect(token).toBe('s.token');
    expect(typeof agent).toBe('object');

    expect(body).toBe(JSON.stringify(bodyObj));
    expect(result).toBe('ciphertext');
  });

  test('createKeyInVault() uses Vault login token, proper URL and stringified body', async () => {
    const controller = new VaultController(
      tokenSignService,
      authService,
      credentialsService,
      encryptionService,
      createKeyService
    );

    await controller.loginVault();

    const keyName = 'my-key';

    const bodyObj = {
      type: 'aes256-gcm96',
      convergent_encryption: false,
      derived: false,
      exportable: false,
      allow_plaintext_backup: false,
    };

    await controller.createKeyInVault(keyName, bodyObj as any);

    expect(createKeyService.createKey).toHaveBeenCalledTimes(1);
    const [url, token, agent, body] = createKeyService.createKey.mock.calls[0];

    expect(url).toBe(`https://vault.local:9300/v1/transit/keys/${keyName}`);
    expect(token).toBe('s.token');
    expect(typeof agent).toBe('object');

    expect(body).toBe(JSON.stringify(bodyObj));
  });

  test('register() register events handlers for services', () => {
    const controller = new VaultController(
      tokenSignService,
      authService,
      credentialsService,
      encryptionService,
      createKeyService
    );

    controller.register();

    expect(registerBusHandler).toHaveBeenCalledWith(
      EventType.SIGN_TOKEN_VAULT,
      expect.any(Function)
    );
    expect(registerBusHandler).toHaveBeenCalledWith(
      EventType.LOGIN_VAULT,
      expect.any(Function)
    );
    expect(registerBusHandler).toHaveBeenCalledWith(
      EventType.RENEW_VAULT_TOKEN,
      expect.any(Function)
    );
    expect(registerBusHandler).toHaveBeenCalledWith(
      EventType.GET_CREDENTIAL_VAULT,
      expect.any(Function)
    );
    expect(registerBusHandler).toHaveBeenCalledWith(
      EventType.CREATE_OR_UPDATE_CREDENTIAL_VAULT,
      expect.any(Function)
    );
    expect(registerBusHandler).toHaveBeenCalledWith(
      EventType.ENCRYPT_TOKEN_VAULT,
      expect.any(Function)
    );
    expect(registerBusHandler).toHaveBeenCalledWith(
      EventType.CREATE_KEY_VAULT,
      expect.any(Function)
    );
  });
});
