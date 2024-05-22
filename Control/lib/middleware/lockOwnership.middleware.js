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

const {grpcErrorToNativeError} = require("../errors/grpcErrorToNativeError");
const {updateExpressResponseFromNativeError} = require("../errors/updateExpressResponseFromNativeError");

/**
 * Middleware function to check that the user has ownership of the locks for the given detectors
 *
 * @param {LockService} lockService - service to be used to check ownership of locks
 * @param {EnvironmentService} environmentService - service to be used to retrieve environment information
 * @return {function(req, res, next): void} - middleware function
 */
const lockOwnershipMiddleware = (lockService, environmentService) => {
  /**
   * Middleware function to check that the user has ownership of the locks for the given detectors
   * @param {Request} req - HTTP Request object
   * @param {Response} res - HTTP Response object
   * @param {Next} next - HTTP Next object to use if checks pass
   * @return {void} continue if checks pass, 403 if checks fail
   */
  return async (req, res, next) => {
    const {name, personid} = req.session;
    const {id = ''} = req.body ?? {};

    try {
      const {includedDetectors = []} = await environmentService.getEnvironment(id);
      if (!lockService.hasLocks(name, personid, includedDetectors)) {
        res.status(403).json({message: `Action not allowed for user ${name} due to missing ownership of lock(s)`});
      } else {
        next();
      }
    } catch (error) {
      updateExpressResponseFromNativeError(res, grpcErrorToNativeError(error));
    }
  };
};

exports.lockOwnershipMiddleware = lockOwnershipMiddleware
