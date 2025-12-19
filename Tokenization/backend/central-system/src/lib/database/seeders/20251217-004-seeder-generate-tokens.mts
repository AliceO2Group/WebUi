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

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type RoutePermissions = Partial<Record<HttpMethod, number>>;

function pickMethods(idx: number): HttpMethod[] {
  const patterns: HttpMethod[][] = [
    ['GET'],
    ['GET', 'POST'],
    ['GET', 'PUT'],
    ['GET', 'DELETE'],
    ['GET', 'POST', 'PUT'],
    ['GET', 'POST', 'DELETE'],
    ['GET', 'PUT', 'DELETE'],
    ['GET', 'POST', 'PUT', 'DELETE'],
  ];
  return patterns[idx % patterns.length];
}

function buildIatExp(now: number, methods: HttpMethod[]) {
  const ttlByMethod: Record<HttpMethod, number> = {
    GET: 3600,
    POST: 3600,
    PUT: 3600,
    DELETE: 3600,
  };

  const iat: RoutePermissions = {};
  const exp: RoutePermissions = {};

  for (const m of methods) {
    iat[m] = now;
    exp[m] = now + ttlByMethod[m];
  }

  return { iat, exp };
}

export async function up(
  q: QueryInterface,
  Sequelize: typeof import('sequelize')
) {
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

  await q.bulkDelete('tokens', {
    audience: { [Sequelize.Op.in]: serials },
  } as any);

  const now = Math.floor(Date.now() / 1000);

  const rows = serials.map((subSerial, idx) => {
    const audSerial = serials[(idx + 3) % serials.length];
    const methods = pickMethods(idx);
    const { iat, exp } = buildIatExp(now - idx * 120, methods);

    const tokenObject = {
      sub: subSerial,
      aud: audSerial,
      iss: '1B61DC5333DB0C3F1B8AABA6ABE212CA88727982',
      iat,
      exp,
      jti: `seed-jti-${subSerial}-${audSerial}-${now}-${idx}`,
    };

    return {
      audience: audSerial,
      subject: subSerial,
      token_object: JSON.stringify(tokenObject),
      created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    };
  });

  await q.bulkInsert('tokens', rows as any[]);
}

export async function down(
  q: QueryInterface,
  Sequelize: typeof import('sequelize')
) {
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

  await q.bulkDelete('tokens', {
    audience: { [Sequelize.Op.in]: serials },
  } as any);
}
