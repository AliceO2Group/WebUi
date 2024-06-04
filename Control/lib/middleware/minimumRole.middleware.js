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

const {isRoleSufficient} = require('../common/role.enum.js');
const {UnauthorizedAccessError} = require('../errors/UnauthorizedAccessError.js');
const {updateExpressResponseFromNativeError} = require('../errors/updateExpressResponseFromNativeError.js');

/**
 * Method to receive a minimum role that needs to be met by owner of request and to return a middleware function
 * @param {Role} minimumRole - minimum role that should be fulfilled by the requestor
 * @return {function(req, res, next): void} - middleware function
 */
const minimumRoleMiddleware = (minimumRole) => {
  /**
   * Returned middleware method
   * @param {Request} req - HTTP Request object
   * @param {Next} next - HTTP Next object to use if checks pass
   * @param {Response} res - HTTP Response object
   * @return {void}
   */
  return (req, res, next) => {
    try {
      const { access } = req?.session ?? '';

      let accessList = [];
      if (typeof access === 'string') {
        accessList = access.split(',');
      } else if (Array.isArray(access)) {
        accessList = access;
      }
      const isAllowed = accessList.some((role) => isRoleSufficient(role, minimumRole));
      if (!isAllowed) {
        updateExpressResponseFromNativeError(res,
          new UnauthorizedAccessError('Not enough permissions for this operation')
        );
        return;
      }
      next();
    } catch (error) {
      console.error(error);
      updateExpressResponseFromNativeError(res, error);
    }
  }
};

exports.minimumRoleMiddleware = minimumRoleMiddleware;
