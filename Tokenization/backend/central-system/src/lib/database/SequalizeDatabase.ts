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

import { LogManager } from "@aliceo2/web-ui";
import { Sequelize } from "sequelize";
import { getConfig } from "./utils/getConfig.js";
import { models } from "./models/models.js";

export class SequalizeDatabase {
  private _logger;
  public sequelize: Sequelize;
  private _models: any;

  constructor(config: JSON) {
    this._logger = LogManager.getLogger("database/sequalize");

    if (!config) {
      this._logger.warnMessage("No database configuration provided");
    }
    const dbConfig = getConfig(config);

    const {
      host,
      port,
      username,
      password,
      database,
      charset,
      collate,
      timezone,
      logging,
    } = dbConfig;

    this.sequelize = new Sequelize(database, username, password, {
      host,
      port,
      dialect: "mariadb",
      dialectOptions: {
        charset,
        collate,
        timezone,
      },
      logging,
      define: {
        underscored: true,
      },
    });
    this._models = models(this.sequelize);
    this._logger.infoMessage("Database connection initialized successfully.");
  }
}
