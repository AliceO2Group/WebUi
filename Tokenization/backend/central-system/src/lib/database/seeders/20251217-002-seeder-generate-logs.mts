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

import type { QueryInterface } from 'sequelize';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export async function up(
  q: QueryInterface,
  Sequelize: typeof import('sequelize')
) {
  await q.bulkDelete('system-logs', {
    request_id: { [Sequelize.Op.like]: 'seed-logs-%' },
  } as any);

  const nowDate = new Date();
  const nowUnix = Math.floor(Date.now() / 1000);

  const serials = [
    '0x01',
    '0x02',
    '0x03',
    '0x04',
    '0x05',
    '0x06',
    '0x07',
    '0x08',
    '0x09',
    '0x0a',
  ];

  const rows: any[] = [
    {
      timestamp: nowDate,
      level: 'INFO' as LogLevel,
      component: 'database/sequelize',
      event: 'DB_SEED_START',
      message: 'Seeders execution started.',
      service_id: null,
      request_id: 'seed-logs-001',
      token_id: null,
      ip_address: null,
      context: JSON.stringify({ seed: true, stage: 'start' }),
      error_stack: null,
      created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    {
      timestamp: nowDate,
      level: 'INFO' as LogLevel,
      component: 'VaultController',
      event: 'VAULT_LOGIN_SUCCESS',
      message: 'Logged into Vault successfully.',
      service_id: null,
      request_id: 'seed-logs-002',
      token_id: null,
      ip_address: '10.10.0.11',
      context: JSON.stringify({
        vault_addr: process.env.VAULT_ADDR ?? 'https://vault.local:9300',
        auth_method: process.env.VAULT_AUTH_METHOD ?? 'cert',
      }),
      error_stack: null,
      created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    },

    ...serials.map((subSerial, idx) => {
      const serviceId = idx + 1;
      const ip = `10.10.0.${11 + idx}`;

      const audSerial = serials[(idx + 3) % serials.length];

      const token_id = `seed-jti-${subSerial}-${audSerial}-${nowUnix}-${idx}`;

      return {
        timestamp: nowDate,
        level: 'INFO' as LogLevel,
        component: 'TokenizationService',
        event: 'TOKEN_CREATED',
        message: `Token created for ${subSerial} -> ${audSerial} (service ${serviceId}).`,
        service_id: serviceId,
        request_id: `seed-logs-svc-${String(serviceId).padStart(2, '0')}`,
        token_id,
        ip_address: ip,
        context: JSON.stringify({
          subject: subSerial,
          audience: audSerial,
          permissions: { GET: 3600, POST: 900 },
          note: 'seeded-test-data',
        }),
        error_stack: null,
        created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
        updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      };
    }),

    {
      timestamp: nowDate,
      level: 'WARN' as LogLevel,
      component: 'VaultAuthService',
      event: 'VAULT_RENEW_FAILED',
      message: 'Vault token renewal failed; re-login will be attempted.',
      service_id: null,
      request_id: 'seed-logs-099',
      token_id: null,
      ip_address: null,
      context: JSON.stringify({ endpoint: '/v1/auth/token/renew-self' }),
      error_stack: null,
      created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    {
      timestamp: nowDate,
      level: 'ERROR' as LogLevel,
      component: 'EncryptionService',
      event: 'VAULT_ENCRYPT_DENIED',
      message: 'Error encrypting data: permission denied.',
      service_id: 1,
      request_id: 'seed-logs-100',
      token_id: `seed-jti-${serials[0]}-${serials[3]}-${nowUnix}-0`,
      ip_address: '10.10.0.11',
      context: JSON.stringify({
        key: 'tokenization-signing',
        path: 'transit/encrypt/tokenization-signing',
      }),
      error_stack:
        'Error: permission denied\n    at EncryptionService.encryptData (...)\n    at VaultController.encryptData (...)',
      created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    {
      timestamp: nowDate,
      level: 'INFO' as LogLevel,
      component: 'database/sequelize',
      event: 'DB_SEED_DONE',
      message: 'Seeders execution finished.',
      service_id: null,
      request_id: 'seed-logs-101',
      token_id: null,
      ip_address: null,
      context: JSON.stringify({ seed: true, stage: 'done' }),
      error_stack: null,
      created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  ];

  await q.bulkInsert('system-logs', rows as any[]);
}

export async function down(
  q: QueryInterface,
  Sequelize: typeof import('sequelize')
) {
  await q.bulkDelete('system-logs', {
    request_id: { [Sequelize.Op.like]: 'seed-logs-%' },
  } as any);
}
