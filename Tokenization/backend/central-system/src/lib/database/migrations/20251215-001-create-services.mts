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

/** Umzug migration: create `services` table */
export async function up(
  q: QueryInterface,
  Sequelize: typeof import('sequelize')
) {
  await q.createTable('services', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    serial_number: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    ip_address: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal(
        'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
      ),
    },
  });

  await q.addIndex('services', ['name'], { name: 'services_name_idx' });
  await q.addIndex('services', ['serial_number'], {
    name: 'services_serial_number_idx',
  });
  await q.addIndex('services', ['ip_address'], {
    name: 'services_ip_address_idx',
  });
  await q.addIndex('services', ['created_at'], {
    name: 'services_created_at_idx',
  });
}

export async function down(q: QueryInterface) {
  try {
    await q.removeIndex('services', 'services_created_at_idx');
  } catch {}
  try {
    await q.removeIndex('services', 'services_ip_address_idx');
  } catch {}
  try {
    await q.removeIndex('services', 'services_serial_number_idx');
  } catch {}
  try {
    await q.removeIndex('services', 'services_name_idx');
  } catch {}
  await q.dropTable('services');
}
