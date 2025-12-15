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

// Import all models here and export them
import TokenModel from './TokenModel.js';
import ArchiveTokenModel from './ArchiveTokenModel.js';
import { Sequelize } from 'sequelize';
import ServiceModel from './ServiceModel.js';
import SystemLogModel from './SystemLogModel.js';
import RouteModel from './RouteModel.js';

export function models(sequelize: Sequelize): {
  Token: ReturnType<typeof TokenModel>;
  ArchiveToken: ReturnType<typeof ArchiveTokenModel>;
  Service: ReturnType<typeof ServiceModel>;
  SystemLog: ReturnType<typeof SystemLogModel>;
  Route: ReturnType<typeof RouteModel>;
} {
  const models = {
    Token: TokenModel(sequelize),
    ArchiveToken: ArchiveTokenModel(sequelize),
    Service: ServiceModel(sequelize),
    SystemLog: SystemLogModel(sequelize),
    Route: RouteModel(sequelize),
  };
  return models;
}
