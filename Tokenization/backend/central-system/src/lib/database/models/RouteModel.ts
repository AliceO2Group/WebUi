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

type RouteStatus = 'active' | 'disabled';

type RoutePermissions = {"GET"?: number, "POST"?: number, "PUT"?: number, "DELETE"?: number};

/** Define the Route model */
class Route extends Model {
  declare id: number;
  declare receiver_serial_number: string;
  declare audience_serial_number: string;
  declare permissions: RoutePermissions;
  declare status: RouteStatus;
  declare created_at: Date;
  declare updated_at: Date;
}

/* Initialize and export the Route model */
export default (sequelize: Sequelize): typeof Route =>
  Route.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },

      receiver_serial_number: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      audience_serial_number: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      permissions: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },

      status: {
        type: DataTypes.ENUM('active', 'disabled'),
        allowNull: false,
        defaultValue: 'active',
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'routes',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { name: 'routes_receiver_serial_idx', fields: ['receiver_serial_number'] },
        { name: 'routes_audience_serial_idx', fields: ['audience_serial_number'] },
        { name: 'routes_status_idx', fields: ['status'] },
        { name: 'routes_receiver_audience_idx', fields: ['receiver_serial_number', 'audience_serial_number'] },
      ],
    }
  );
