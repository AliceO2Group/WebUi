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

type RoutePermissions = {
  GET?: number;
  POST?: number;
  PUT?: number;
  DELETE?: number;
};
type RouteStatus = 'active' | 'disabled';

function pickPerms(idx: number): RoutePermissions {
  const patterns: RoutePermissions[] = [
    { GET: 3600 },
    { GET: 3600, POST: 900 },
    { GET: 3600, PUT: 1800 },
    { GET: 3600, DELETE: 600 },
    { GET: 3600, POST: 900, PUT: 1800 },
    { GET: 3600, POST: 900, DELETE: 600 },
    { GET: 3600, PUT: 1800, DELETE: 600 },
    { GET: 3600, POST: 900, PUT: 1800, DELETE: 600 },
  ];
  return patterns[idx % patterns.length];
}

function pickStatus(idx: number): RouteStatus {
  return idx % 4 === 0 ? 'disabled' : 'active';
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

  // usuń seeded trasy w tej puli
  await q.bulkDelete('routes', {
    receiver_serial_number: { [Sequelize.Op.in]: serials },
    audience_serial_number: { [Sequelize.Op.in]: serials },
  } as any);

  const rows: any[] = [];
  let k = 0;

  for (let i = 0; i < serials.length; i++) {
    const receiver = serials[i];
    const aud1 = serials[(i + 1) % serials.length];
    const aud2 = serials[(i + 3) % serials.length];

    rows.push({
      receiver_serial_number: receiver,
      audience_serial_number: aud1,
      permissions: JSON.stringify(pickPerms(k)),
      status: pickStatus(k),
      created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    k++;

    rows.push({
      receiver_serial_number: receiver,
      audience_serial_number: aud2,
      permissions: JSON.stringify(pickPerms(k)),
      status: pickStatus(k),
      created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    k++;
  }

  await q.bulkInsert('routes', rows);
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

  await q.bulkDelete('routes', {
    receiver_serial_number: { [Sequelize.Op.in]: serials },
    audience_serial_number: { [Sequelize.Op.in]: serials },
  } as any);
}
