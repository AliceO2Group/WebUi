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

const { LogManager, LogLevel } = require("@aliceo2/web-ui");
const { errorHandler, errorLogger } = require("../utils.js");
const { getConsulConfig } = require("../config/publicConfigProvider.js");

/**
 * Gateway for all Consul Consumer calls
 */
class ConfigurationController {
    /**
     * Setup ConfigurationController
     * @param {ConsulService} consulService
     * @param {JSON} config
     */
    constructor(consulService, config) {
        this.consulService = consulService;
        this.config = getConsulConfig({ consul: config });
        this.configurationsPath = `${this.config.qcPath}/ANY/any`;

        this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? "cog"}/consul`);
    }

    /**
     * Check if consulService is present:
     * * If yes, allow request to continue
     * * If not, send response accordingly
     * @param {Request} req
     * @param {Response} res
     * @param {Next} next
     */
    validateService(req, res, next) {
        if (this.consulService) {
            next();
        } else {
            errorHandler("Unable to retrieve configuration of consul service", res, 502);
        }
    }

    /**
     * Method to check if consul service can be used
     */
    async testConsulStatus() {
        this.consulService
            .getConsulLeaderStatus()
            .then((data) => this._logger.info(`Service is up and running on: ${data}`))
            .catch((error) => this._logger.error(`Connection failed due to ${error}`));
    }

    /**
     * Get configurations from Consul
     * @param {Request} req
     * @param {Response} res
     */
    async getConfigurations(req, res) {
        const prefix = req.query.prefix;
        const recurse = req.query.recurse === "true";
        const prefixPath = prefix ? `${this.configurationsPath}/${prefix}` : this.configurationsPath;
        try {
            const data = await this.consulService.getOnlyRawValuesByKeyPrefix(prefixPath);
            const parsedData = Object.entries(data || {})
                .map(([key, value]) => {
                    try {
                        return {
                            key,
                            value: JSON.parse(value),
                        };
                    } catch (e) {
                        return undefined;
                    }
                })
                .filter((item) => item !== undefined)
                .filter((item) => recurse || !item.key.replace(`${prefixPath}/`, "").includes("/"));

            res.status(200).json(parsedData);
        } catch (error) {
            errorLogger(error, this._logger);
            errorHandler("Error retrieving configurations", res, 500);
        }
    }
}

exports.ConfigurationController = ConfigurationController;
