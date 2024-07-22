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

import { LogManager } from '@aliceo2/web-ui';

/**
 * Gateway for all calls that are to query InfoLogger database
 */
export class QueryController {
  /**
   * Setup QueryController to be used in the API router
   * @param {SQLDataSource} queryService - service to be used to query information on the logs
   */
  constructor(queryService) {
    /**
     * @type {SQLDataSource}
     */
    this._queryService = queryService;
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'ilg'}/query-ctrl`);
  }

  /**
   * API endpoint for retrieving total number of logs grouped by severity for a given runNumber
   * @param {Request} req - HTTP request object with "query" information on object
   * @param {Response} res - HTTP response object to provide information on request
   * @returns {void}
   */
  async getQueryStats(req, res) {
    const { runNumber } = req.query;
    if (!runNumber || isNaN(runNumber)) {
      res.status(400).json({ error: 'Invalid runNumber provided' });
    } else {
      try {
        const stats = await this._queryService.queryGroupCountLogsBySeverity(runNumber);
        res.status(200).json(stats);
      } catch (error) {
        this._logger.errorMessage(error.toString(), { level: 99, facility: 'ilg/query-ctrl', run: runNumber });
        res.status(502).json({ error: `Unable to serve query on stats for runNumber: ${runNumber}` });
      }
    }
  }

  /**
   * Setter for updating the queryService
   * @param {SQLDataSource} queryService - service to be used to query information on the logs
   */
  set queryService(queryService) {
    this._queryService = queryService;
  }

  /**
   * Getter for the queryService instance currently being used
   * @returns {SQLDataSource} - instance of queryService
   */
  get queryService() {
    return this._queryService;
  }
}
