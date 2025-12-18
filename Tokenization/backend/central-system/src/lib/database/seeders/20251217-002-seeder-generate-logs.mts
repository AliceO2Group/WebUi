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

  const now = new Date();

  const rows = [
    {
      timestamp: now,
      level: 'INFO' as LogLevel,
      component: 'database/sequelize',
      event: 'DB_SEED_START',
      message: 'Seeders execution started.',
      service_id: null,
      request_id: 'seed-logs-001',
      user_id: null,
      ip_address: null,
      context: JSON.stringify({ seed: true, stage: 'start' }),
      error_stack: null,
      created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    {
      timestamp: now,
      level: 'INFO' as LogLevel,
      component: 'VaultController',
      event: 'VAULT_LOGIN_SUCCESS',
      message: 'Logged into Vault successfully.',
      service_id: null,
      request_id: 'seed-logs-002',
      user_id: null,
      ip_address: '10.10.0.11',
      context: JSON.stringify({
        vault_addr: process.env.VAULT_ADDR ?? 'https://vault.local:9300',
        auth_method: process.env.VAULT_AUTH_METHOD ?? 'cert',
      }),
      error_stack: null,
      created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    },

    ...Array.from({ length: 10 }, (_, i) => {
      const serviceId = i + 1;
      const serial = `0x${String(i + 1).padStart(2, '0')}`;
      const ip = `10.10.0.${11 + i}`;
      return {
        timestamp: now,
        level: 'INFO' as LogLevel,
        component: 'TokenizationService',
        event: 'ROUTE_EVALUATED',
        message: `Route evaluated for service ${serviceId} (${ip}).`,
        service_id: serviceId,
        request_id: `seed-logs-svc-${String(serviceId).padStart(2, '0')}`,
        user_id: null,
        ip_address: ip,
        context: JSON.stringify({
          receiver_serial_number: i === 9 ? '0x0a' : serial,
          audience_serial_number:
            i === 8 ? '0x0a' : `0x${String(i + 2).padStart(2, '0')}`,
          permissions: { GET: 3600, POST: 900 },
        }),
        error_stack: null,
        created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
        updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      };
    }),

    {
      timestamp: now,
      level: 'WARN' as LogLevel,
      component: 'VaultAuthService',
      event: 'VAULT_RENEW_FAILED',
      message: 'Vault token renewal failed; re-login will be attempted.',
      service_id: null,
      request_id: 'seed-logs-099',
      user_id: null,
      ip_address: null,
      context: JSON.stringify({ endpoint: '/v1/auth/token/renew-self' }),
      error_stack: null,
      created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    {
      timestamp: now,
      level: 'ERROR' as LogLevel,
      component: 'EncryptionService',
      event: 'VAULT_ENCRYPT_DENIED',
      message: 'Error encrypting data: permission denied.',
      service_id: 1,
      request_id: 'seed-logs-100',
      user_id: null,
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
      timestamp: now,
      level: 'INFO' as LogLevel,
      component: 'database/sequelize',
      event: 'DB_SEED_DONE',
      message: 'Seeders execution finished.',
      service_id: null,
      request_id: 'seed-logs-101',
      user_id: null,
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

  await q.bulkDelete('system-logs', {
    request_id: { [Sequelize.Op.like]: 'seed-logs-svc-%' },
  } as any);
}
