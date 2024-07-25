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

const { InvalidInputError } = require('./../errors/InvalidInputError.js');
const { DetectorLockAction } = require('./../common/lock/detectorLockAction.enum.js');
const { Log } = require('@aliceo2/web-ui');
const { updateExpressResponseFromNativeError } = require('./../errors/updateExpressResponseFromNativeError.js');
const { User } = require('./../dtos/User.js');

const ERROR_LOG_LEVEL = 99;
const LOG_FACILITY = 'cog/log-ctrl';
const DETECTOR_ALL = 'ALL';

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
      res.status(200).json(this._lockService.locksByDetectorToJSON());
    } catch (error) {
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
    const { action, detectorId, shouldForce = false } = req.params;
    const { personid, name, username, access } = req.session;
    try {
      if (!detectorId) {
        throw new InvalidInputError('Missing detectorId');
      }
      if (!action || !DetectorLockAction[action.toLocaleUpperCase()]) {
        throw new InvalidInputError(`Invalid action to apply on lock for detector: ${detectorId}`);
      }
      const user = new User(username, name, personid, access);
      if (action.toLocaleUpperCase() === DetectorLockAction.TAKE) {
        if (detectorId === DETECTOR_ALL) {
          Object.keys(this._lockService.locksByDetector).forEach((detector) => {
            try {
              this._lockService.takeLock(detector, user, shouldForce);
            } catch (error) {
              console.error(error);
            }
          });
        } else {
          this._lockService.takeLock(detectorId, user, shouldForce);
        }
        res.status(200).json(this._lockService.locksByDetectorToJSON());
      } else if (action.toLocaleUpperCase() === DetectorLockAction.RELEASE) {
        if (detectorId === DETECTOR_ALL) {
          Object.keys(this._lockService.locksByDetector).forEach((detector) => {
            try {
              this._lockService.releaseLock(detector, user, shouldForce);
            } catch (error) {
              console.error(error);
            }
          });
        } else {
          this._lockService.releaseLock(detectorId, user, shouldForce);
        }
        res.status(200).json(this._lockService.locksByDetectorToJSON());
      }
    } catch (error) {
      this._logger.errorMessage(error, { level: ERROR_LOG_LEVEL, facility: LOG_FACILITY });
      updateExpressResponseFromNativeError(res, error);
    }
  }

  /**
   * API - PUT endpoint for updating the state of a detector lock with force option
   * @param {Request} req - HTTP Request object
   * @param {Response} res - HTTP Response object
   * @returns {void}
   */
  async actionForceLockHandler(req, res) {
    req.params.shouldForce = true;
    this.actionLockHandler(req, res);
  }
}

exports.LockController = LockController;
