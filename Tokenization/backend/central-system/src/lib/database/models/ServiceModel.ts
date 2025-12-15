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

/** Define the Service model */
class Service extends Model {
  declare id: number;
  declare name: string;
  declare serial_number: string;
  declare ip_address: string;

  // timestamps managed by Sequelize
  declare created_at: Date;
  declare updated_at: Date;
}

/* Initialize and export the Service model */
export default (sequelize: Sequelize): typeof Service =>
  Service.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      serial_number: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: false,
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
      tableName: 'services',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { name: 'services_name_idx', fields: ['name'] },
        { name: 'services_serial_number_idx', fields: ['serial_number'] },
        { name: 'services_ip_address_idx', fields: ['ip_address'] },
        { name: 'services_created_at_idx', fields: ['created_at'] },
      ],
    }
  );
