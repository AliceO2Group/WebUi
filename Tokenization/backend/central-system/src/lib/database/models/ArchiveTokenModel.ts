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

type TokenTimings = {
  GET?: number;
  POST?: number;
  PUT?: number;
  DELETE?: number;
};
type TokenStatus = 'REVOKED' | 'REJECTED' | 'EXPIRED';

// Define the structure of the archived token object
interface ArchivedTokenAttributes {
  sub: string;
  aud: string;
  iss: string;
  iat: TokenTimings;
  exp: TokenTimings;
  jti: string;
}

// Define the ArchiveToken model
class ArchiveToken extends Model {
  declare id: number;
  declare audience: string;
  declare subject: string;
  declare status: TokenStatus;
  declare created_at: Date;
  declare updated_at: Date;
  declare token_object: ArchivedTokenAttributes;
}

/* Initialize and export the ArchiveToken model */
export default (sequelize: Sequelize): typeof ArchiveToken =>
  ArchiveToken.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      audience: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('REVOKED', 'REJECTED', 'EXPIRED'),
        allowNull: false,
      },
      token_object: {
        type: DataTypes.JSON,
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
      tableName: 'archive-tokens',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { name: 'archive_tokens_audience_idx', fields: ['audience'] },
        { name: 'archive_tokens_subject_idx', fields: ['subject'] },
        { name: 'archive_tokens_created_at_idx', fields: ['created_at'] },
      ],
    }
  );
