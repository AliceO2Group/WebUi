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
type ArchiveStatus = 'REVOKED' | 'REJECTED' | 'EXPIRED';

function statusForIdx(idx: number): ArchiveStatus {
  const order: ArchiveStatus[] = ['REVOKED', 'REJECTED', 'EXPIRED'];
  return order[idx % order.length];
}

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

function buildIatExpForStatus(
  now: number,
  methods: HttpMethod[],
  status: ArchiveStatus
) {
  const iat: RoutePermissions = {};
  const exp: RoutePermissions = {};

  const ttlNormal: Record<HttpMethod, number> = {
    GET: 3600,
    POST: 900,
    PUT: 1800,
    DELETE: 600,
  };
  const ttlExpired: Record<HttpMethod, number> = {
    GET: 300,
    POST: 300,
    PUT: 300,
    DELETE: 300,
  };

  const ttl = status === 'EXPIRED' ? ttlExpired : ttlNormal;

  for (const m of methods) {
    iat[m] = now;
    exp[m] = now + ttl[m];
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

  await q.bulkDelete('archive-tokens', {
    audience: { [Sequelize.Op.in]: serials },
  } as any);

  const now = Math.floor(Date.now() / 1000);

  const rows = serials.map((subSerial, idx) => {
    const audSerial = serials[(idx + 5) % serials.length];
    const status = statusForIdx(idx);
    const methods = pickMethods(idx);

    const issuedAt =
      status === 'EXPIRED' ? now - (idx + 10) * 3600 : now - (idx + 1) * 600;

    const { iat, exp } = buildIatExpForStatus(issuedAt, methods, status);

    const tokenObject = {
      sub: subSerial,
      aud: audSerial,
      iss: 'central-system',
      iat,
      exp,
      jti: `seed-arch-jti-${subSerial}-${audSerial}-${now}-${idx}`,
    };

    return {
      audience: audSerial,
      subject: subSerial,
      status,
      token_object: JSON.stringify(tokenObject),
      created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    };
  });

  await q.bulkInsert('archive-tokens', rows as any[]);
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

  await q.bulkDelete('archive-tokens', {
    audience: { [Sequelize.Op.in]: serials },
  } as any);
}
