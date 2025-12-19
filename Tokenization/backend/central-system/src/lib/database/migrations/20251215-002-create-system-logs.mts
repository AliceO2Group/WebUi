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
  await q.createTable('system-logs', {
    id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },

    timestamp: {
      type: Sequelize.DATE(3),
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)'),
    },

    level: {
      type: Sequelize.ENUM('DEBUG', 'INFO', 'WARN', 'ERROR'),
      allowNull: false,
    },

    component: {
      type: Sequelize.STRING(128),
      allowNull: false,
    },

    event: {
      type: Sequelize.STRING(128),
      allowNull: false,
    },

    message: {
      type: Sequelize.TEXT,
      allowNull: false,
    },

    service_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },

    request_id: {
      type: Sequelize.STRING(64),
      allowNull: true,
    },

    token_id: {
      type: Sequelize.STRING(64),
      allowNull: true,
    },

    ip_address: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },

    context: {
      type: Sequelize.JSON,
      allowNull: true,
    },

    error_stack: {
      type: Sequelize.TEXT,
      allowNull: true,
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

  await q.addIndex('system-logs', ['timestamp'], {
    name: 'system_logs_timestamp_idx',
  });
  await q.addIndex('system-logs', ['level', 'timestamp'], {
    name: 'system_logs_level_timestamp_idx',
  });
  await q.addIndex('system-logs', ['component', 'timestamp'], {
    name: 'system_logs_component_timestamp_idx',
  });
  await q.addIndex('system-logs', ['event', 'timestamp'], {
    name: 'system_logs_event_timestamp_idx',
  });
  await q.addIndex('system-logs', ['service_id', 'timestamp'], {
    name: 'system_logs_service_timestamp_idx',
  });
  await q.addIndex('system-logs', ['request_id'], {
    name: 'system_logs_request_id_idx',
  });
  await q.addIndex('system-logs', ['token_id'], {
    name: 'system_logs_token_id_idx',
  });
}

export async function down(q: QueryInterface) {
  try {
    await q.removeIndex('system-logs', 'system_logs_token_id_idx');
  } catch {}
  try {
    await q.removeIndex('system-logs', 'system_logs_request_id_idx');
  } catch {}
  try {
    await q.removeIndex('system-logs', 'system_logs_service_timestamp_idx');
  } catch {}
  try {
    await q.removeIndex('system-logs', 'system_logs_event_timestamp_idx');
  } catch {}
  try {
    await q.removeIndex('system-logs', 'system_logs_component_timestamp_idx');
  } catch {}
  try {
    await q.removeIndex('system-logs', 'system_logs_level_timestamp_idx');
  } catch {}
  try {
    await q.removeIndex('system-logs', 'system_logs_timestamp_idx');
  } catch {}

  await q.dropTable('system-logs');
}
