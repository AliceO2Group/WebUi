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

/** Umzug migration: create `routes` table */
export async function up(
  q: QueryInterface,
  Sequelize: typeof import('sequelize')
) {
  await q.createTable('routes', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },

    receiver_serial_number: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },

    audience_serial_number: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },

    permissions: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: Sequelize.literal(`'{}'`),
    },

    status: {
      type: Sequelize.ENUM('active', 'disabled'),
      allowNull: false,
      defaultValue: 'active',
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

  await q.addIndex('routes', ['receiver_serial_number'], {
    name: 'routes_receiver_serial_idx',
  });
  await q.addIndex('routes', ['audience_serial_number'], {
    name: 'routes_audience_serial_idx',
  });
  await q.addIndex('routes', ['status'], {
    name: 'routes_status_idx',
  });
  await q.addIndex(
    'routes',
    ['receiver_serial_number', 'audience_serial_number'],
    {
      name: 'routes_receiver_audience_idx',
    }
  );
  await q.addIndex('routes', ['created_at'], {
    name: 'routes_created_at_idx',
  });
}

export async function down(q: QueryInterface) {
  try {
    await q.removeIndex('routes', 'routes_created_at_idx');
  } catch {}
  try {
    await q.removeIndex('routes', 'routes_receiver_audience_idx');
  } catch {}
  try {
    await q.removeIndex('routes', 'routes_status_idx');
  } catch {}
  try {
    await q.removeIndex('routes', 'routes_audience_serial_idx');
  } catch {}
  try {
    await q.removeIndex('routes', 'routes_receiver_serial_idx');
  } catch {}
  await q.dropTable('routes');
}
