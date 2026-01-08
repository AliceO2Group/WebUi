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

import { Sequelize, Model, DataTypes } from 'sequelize';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  [key: string]: unknown;
}

/** Define the SystemLog model */
class SystemLog extends Model {
  declare id: number;

  // core log fields
  declare timestamp: Date;
  declare level: LogLevel;
  declare component: string;
  declare event: string;
  declare message: string;

  // correlation / optional metadata
  declare service_id: number | null;   
  declare request_id: string | null;
  declare token_id: string | null; 
  declare ip_address: string | null;

  // structured extras
  declare context: LogContext | null;
  declare error_stack: string | null;
}

/* Initialize and export the SystemLog model */
export default (sequelize: Sequelize): typeof SystemLog =>
  SystemLog.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },

      timestamp: {
        type: DataTypes.DATE(3),
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      level: {
        type: DataTypes.ENUM('DEBUG', 'INFO', 'WARN', 'ERROR'),
        allowNull: false,
      },

      component: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },

      event: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },

      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      service_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      request_id: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },

      token_id: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },

      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },

      context: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      error_stack: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'system-logs',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { name: 'system_logs_timestamp_idx', fields: ['timestamp'] },
        {
          name: 'system_logs_level_timestamp_idx',
          fields: ['level', 'timestamp'],
        },
        {
          name: 'system_logs_component_timestamp_idx',
          fields: ['component', 'timestamp'],
        },
        {
          name: 'system_logs_event_timestamp_idx',
          fields: ['event', 'timestamp'],
        },
        {
          name: 'system_logs_service_timestamp_idx',
          fields: ['service_id', 'timestamp'],
        },
        { name: 'system_logs_request_id_idx', fields: ['request_id'] },

        { name: 'system_logs_token_id_idx', fields: ['token_id'] },
      ],
    }
  );
