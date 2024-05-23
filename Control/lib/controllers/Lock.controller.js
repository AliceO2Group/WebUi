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
const {updateExpressResponseFromNativeError} = require('./../errors/updateExpressResponseFromNativeError.js');
const {InvalidInputError} = require('./../errors/InvalidInputError.js');
const {LockAction} = require('./../common/lock/lockAction.enum.js');
const {User} = require('./../dtos/User.js');

const ERROR_LOG_LEVEL = 99;
const LOG_FACILITY = 'cog/log-ctrl';

/**
 * Controller for dealing with all API requests on actions and state of the locks used for detectors
 */
class LockController {
  /**
   * Constructor for initializing controller of locks
   * @param {LockService} lockService - service to use to build information on runs
   */
  constructor(lockService) {
    this._logger = new Log(`${process.env.npm_config_log_label ?? 'cog'}/${LOG_FACILITY}`);

    /**
     * @type {LockService}
     */
    this._lockService = lockService;
  }

  /**
   * API - GET endpoint for retrieving current state of the locks
   * @param {Request} _ - HTTP Request object
   * @param {Response} res - HTTP Response object
   * @returns {void}
   */
  async getLocksStateHandler(_, res) {
    try {
      res.status(200).json(this._lockService.locksByDetector);
    } catch (error) {
      this._logger.debug(error);
      updateExpressResponseFromNativeError(res, error);
    }
  }

  /**
   * API - PUT endpoint for updating the state of a detector lock
   * @param {Request} req - HTTP Request object
   * @param {Response} res - HTTP Response object
   * @returns {void}
   */
  async actionLockHandler(req, res) {
    const {action, detectorId, shouldForce = false} = req.params;
    const {personid, name, access} = req.session;
    try {
      if (!detectorId) {
        throw new InvalidInputError('Missing detectorId');
      }
      if (!action || !LockAction[action.toLocaleUpperCase()]) {
        throw new InvalidInputError(`Invalid action to apply on lock for detector: ${detectorId}`);
      }
      const user = new User(name, personid, access);
      // TODO Name or username (apricot check as well)

      if (action.toLocaleUpperCase() === LockAction.TAKE) {
        const state = this._lockService.takeLock(detectorId, user, shouldForce);
        console.log(state)
        res.status(200).json(state);
      } else if (action.toLocaleUpperCase() === LockAction.RELEASE) {
        const state = this._lockService.releaseLock(detectorId, user, shouldForce);
        res.status(200).json(state);
      }
    } catch (error) {
      this._logger.errorMessage(error, {level: ERROR_LOG_LEVEL, facility: LOG_FACILITY});
      updateExpressResponseFromNativeError(res, error);
    }
  }
}

exports.LockController = LockController;
