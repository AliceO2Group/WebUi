/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

const {LogManager, updateAndSendExpressResponseFromNativeError} = require('@aliceo2/web-ui');
const {User} = require('./../dtos/User.js');

/**
 * Middleware function to check that the user has ownership of the locks for the requested detectors
 *
 * @param {LockService} lockService - service to be used to check ownership of locks
 * @returns {function(req, res, next): void} - middleware function
 */
const verifyLockOwnershipMiddleware = (lockService) => {
  /**
   * Middleware function to check that the user has ownership of the locks for the given detectors
   * @param {Request} req - HTTP Request object
   * @param {@aliceo2/web-ui.Session} req.session - Session object from request
   * @param {object} req.body - Body object from request
   * @param {string[]} req.body.detector - List of detectors to check ownership of
   * @param {Response} res - HTTP Response object
   * @param {Next} next - HTTP Next object to use if checks pass
   * @returns {void} continue if checks pass, uses response object to respond with error if checks fail
   */
  return async (req, res, next) => {
    const { name, username, personid, access } = req.session;
    const requestor = new User(username, name, personid, access);
    const { detectors = [] } = req.body;

    try {
      if (!lockService.hasLocks(requestor, detectors)) {
        res.status(403).json({message: `Action not allowed for user ${name} due to missing ownership of lock(s)`});
      } else {
        next();
      }
    } catch (error) {
      LogManager
        .getLogger(`${process.env.npm_config_log_label ?? 'cog'}/verify-lock-ownership`)
        .errorMessage(error);
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  };
};

exports.verifyLockOwnershipMiddleware = verifyLockOwnershipMiddleware
