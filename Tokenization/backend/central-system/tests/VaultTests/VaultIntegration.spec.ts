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

import fs from 'fs';
import path from 'path';
import { VaultController } from '../../src/controllers/VaultController';
import { VaultAuthService } from '../../src/services/VaultAuthService';
import { VaultSignService } from '../../src/services/VaultSignService';

import { VaultCredentialsService } from '../../src/services/VaultCredentialsService';

const b64 = (buf: Buffer) => buf.toString('base64');

function ensureVaultEnvFromFilesIfMissing() {
  const backendRoot = path.resolve(__dirname, '..', '..');
  const repoRoot = path.resolve(backendRoot, '..', '..');

  const caPath = path.join(repoRoot, 'docker', 'vault', 'ca.crt');
  const csCertPath = path.join(
    repoRoot,
    'docker',
    'vault',
    'central-system.crt'
  );
  const csKeyPath = path.join(
    repoRoot,
    'docker',
    'vault',
    'central-system.key'
  );

  if (!process.env.VAULT_CACERT_B64 && fs.existsSync(caPath)) {
    process.env.VAULT_CACERT_B64 = b64(fs.readFileSync(caPath));
  }
  if (!process.env.VAULT_CENTRAL_SYSTEM_CERT_B64 && fs.existsSync(csCertPath)) {
    process.env.VAULT_CENTRAL_SYSTEM_CERT_B64 = b64(
      fs.readFileSync(csCertPath)
    );
  }
  if (!process.env.VAULT_CENTRAL_SYSTEM_KEY_B64 && fs.existsSync(csKeyPath)) {
    process.env.VAULT_CENTRAL_SYSTEM_KEY_B64 = b64(fs.readFileSync(csKeyPath));
  }

  if (!process.env.VAULT_ADDR) {
    process.env.VAULT_ADDR = 'https://vault.local:9300';
  }
  if (!process.env.VAULT_AUTH_METHOD) {
    process.env.VAULT_AUTH_METHOD = 'cert';
  }
  if (!process.env.VAULT_ROLE) {
    process.env.VAULT_ROLE = 'central-system';
  }
}

describe('VaultController - integration with Vault', () => {
  let controller: VaultController;

  beforeAll(async () => {
    ensureVaultEnvFromFilesIfMissing();

    controller = new VaultController(
      new VaultSignService(),
      new VaultAuthService(),
      new VaultCredentialsService()
    );

    await controller.loginVault();
  }, 30000);

  beforeAll(async () => {
    ensureVaultEnvFromFilesIfMissing();

    console.log('DEBUG VAULT ENVS (integration):', {
      CA: process.env.VAULT_CACERT_B64 ? 'set' : 'missing',
      CERT: process.env.VAULT_CENTRAL_SYSTEM_CERT_B64 ? 'set' : 'missing',
      KEY: process.env.VAULT_CENTRAL_SYSTEM_KEY_B64 ? 'set' : 'missing',
    });

    controller = new VaultController(
      new VaultSignService(),
      new VaultAuthService(),
      new VaultCredentialsService()
    );

    await controller.loginVault();
  }, 30000);
  it('renews Vault token successfully', async () => {
    await controller.renewVaultToken();
  }, 20000);

  it('creates/updates and then reads back a secret from KV', async () => {
    const pathInVault = 'integration-test/app-config';

    const body = {
      data: {
        foo: 'bar',
        answer: '42',
      },
    };

    await controller.createOrUpdateCredentialInVault(pathInVault, body);

    const secret = await controller.getCredentialFromVault(pathInVault);

    const payload =
      (secret as any).data?.data ?? (secret as any).data ?? secret;

    expect(payload.foo).toBe('bar');
    expect(payload.answer).toBe('42');
  }, 20000);

  it('signs a payload using Transit engine', async () => {
    const payload = {
      data: {
        sub: 'user-123',
        role: 'integration-test',
      },
    };

    const signature = await controller.signToken(payload as any);

    expect(typeof signature).toBe('string');
    expect(signature.length).toBeGreaterThan(0);
  }, 20000);
});
