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

const {
  updateAndSendExpressResponseFromNativeError,
  InvalidInputError, UnauthorizedAccessError
} = require('@aliceo2/web-ui');
const {User} = require('../dtos/User.js');

/**
 * Middleware function to check that the role of a user can access requested detector operations
 * Based on the session object, it checks if the user had the role of a certain detector.
 * If a user is either GLOBAL or ADMIN, they can bypass the ownership check.
 * @param {Request} req - Express Request object.
 * @param {Response} res - Express Response object.
 * @param {Function} next - Next middleware to call.
 */
const requireDetectorOrGlobalRoleMiddleware = (req, res, next) => {
  const { detectorId } = req.params ?? {};

  if (!detectorId) {
    return updateAndSendExpressResponseFromNativeError(res,
      new InvalidInputError('Invalid request: missing detectorId parameter')); 
  }
  
  try {
    const { name, username, personid, access } = req.session || {};
    const user = new User(username, name, personid, access);
    if (user.isUserAtLeastGlobal()) {
      // If the user has GLOBAL or ADMIN role, they can bypass the ownership check
      next();
      return;
    }
    if (!user.belongsToDetector(detectorId)) {
      return updateAndSendExpressResponseFromNativeError(res, 
        new UnauthorizedAccessError(`User "${name}" is not part of role for detector "${detectorId}"`));
    }
  
    next();
  } catch (error) {
    console.error('Error in requireDetectorOrGlobalRoleMiddleware:', error);
    return updateAndSendExpressResponseFromNativeError(res, error);
  }
};
  
exports.requireDetectorOrGlobalRoleMiddleware = requireDetectorOrGlobalRoleMiddleware;
