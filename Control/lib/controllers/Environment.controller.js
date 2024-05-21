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
const {Log} = require('@aliceo2/web-ui');
const LOG_FACILITY = 'cog/env-ctrl';
const DESTROY_ENVIRONMENT = 'DestroyEnvironment';

/**
 * Controller for dealing with all API requests on environments such as:
 * - retrieving information
 * - transitioning an environment
 * - creating an environment
 */
class EnvironmentController {
  /**
   * Constructor for initializing controller of statuses
   * @param {GrpcProxy} grpcCore - service for interacting with Control gRPC server
   * @param {Lock} lockService - service to retrieve information on who owns the lock for a detector
   */
  constructor(grpcCore, lockService) {
    this._log = new Log(`${process.env.npm_config_log_label ?? 'cog'}/env-ctrl`);

    /**
     * @type {GrpcProxy}
     */
    this._grpcCore = grpcCore;

    /**
     * @type {Lock}
     */
    this._lockService = lockService;
  }

  /**
   * API - DELETE endpoint to shutdown/kill(force option) and environment
   * @param {Request} req - HTTP Request object
   * @param {Response} res - HTTP Response object
   * @returns
   */
  async destroyEnvironment(req, res) {
    const {id} = req.params;
    const {username, personid, name} = req.session;
    const {runNumber, force} = req.body; // TODO in future use in-memory environments
    this._log.infoMessage(
      `${name} (${username} - ${personid}) requested => ${DESTROY_ENVIRONMENT} ${force && 'by force (KILL)'}`,
      {level: 1, facility: LOG_FACILITY, partition: id, run: runNumber}
    );
    try {
      await this._grpcCore[DESTROY_ENVIRONMENT]({
        id,
        allowInRunningState: force,
        force,
        runNumber
      });
      res.statusCode(204);
    } catch (error) {
      this._log.warnMessage(
        `${name} (${username} - ${personid}) requested => ${DESTROY_ENVIRONMENT} ${force && 'by force (KILL)'}`,
        {level: 1, facility: LOG_FACILITY, partition: id, run: runNumber}
      );
      res.status(502).send({message: error.message || error});
    }
  }

}

exports.EnvironmentController = EnvironmentController;
