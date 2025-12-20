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
    '0x0A',
  ];

  const rows = serials.map((serial, idx) => ({
    name: `client-${String(idx + 1).padStart(2, '0')}`,
    serial_number: serial,
    ip_address: `10.10.0.${11 + idx}`,

    issued_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    exp_at: Sequelize.literal('DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR)'),

    created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
  }));

  await q.bulkDelete('services', {
    serial_number: { [Sequelize.Op.in]: serials },
  } as any);
  await q.bulkInsert('services', rows as any[]);
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

  await q.bulkDelete('services', {
    serial_number: { [Sequelize.Op.in]: serials },
  } as any);
}
