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

/**
 * Gateway for all calls with regards to the status of the framework and its dependencies
 */
export class StatusController {
  /**
   * Setup StatusController with its service
   * @param {StatusService} statusService - service to be used for retrieving status about dependencies
   */
  constructor(statusService) {
    /**
     * @type {StatusService}
     */
    this._statusService = statusService;
  }

  /**
   * Method to use response object to reply with status and information about QCG for FLP - HealthChecks (via Consul)
   * @param {Request} _ - HTTP request object
   * @param {Response} res - HTTP response object
   * @returns {undefined}
   */
  async getQCGStatus(_, res) {
    res.status(200).json(this._statusService.retrieveOwnStatus());
  }

  /**
   * Send back information and status about the framework and its dependencies
   * @param {Request} _ - HTTP request object
   * @param {Response} res - HTTP response object
   * @returns {undefined}
   */
  async getFrameworkInfo(_, res) {
    try {
      const info = await this._statusService.retrieveFrameworkInfo();
      res.status(200).json(info);
    } catch (error) {
      res.status(503).json({ message: error.message || error });
    }
  }
}
