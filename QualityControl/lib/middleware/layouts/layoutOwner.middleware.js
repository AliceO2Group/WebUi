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

import { InvalidInputError } from '../../errors/InvalidInputError.js';
import { UnauthorizedAccessError } from '../../errors/UnauthorizedAccessError.js';
import { updateExpressResponseFromNativeError } from '../../errors/updateExpressResponseFromNativeError.js';

/**
 * Middleware that checks if the requestor is the owner of the layout
 * @param {JSONFileConnector} dataService - service for getting/setting layout data
 * @returns  {function(req, res, next): Function} - middleware function
 */
export const layoutOwnerMiddleware = (dataService) =>

/**
 * Returned middleware method
 * @param {Express.Request} req - HTTP Request
 * @param {Express.Response} res - HTTP Response
 * @param {Express.Next} next - HTTP Next (check pass)
 */
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { personid = '', name = '' } = req.session ?? {};

      if (!dataService) {
        updateExpressResponseFromNativeError(
          res,
          new InvalidInputError('The "dataService" parameter is missing from the request'),
        );
        return;
      }

      const { ownerName = '', ownerId = '' } = await dataService.readLayout(id) ?? {};
      if (!ownerName || !ownerId) {
        updateExpressResponseFromNativeError(
          res,
          new UnauthorizedAccessError('Unable to retrieve layout owner information'),
        );
        return;
      } else if (!personid || !name) {
        updateExpressResponseFromNativeError(
          res,
          new UnauthorizedAccessError('Unable to retrieve session information'),
        );
        return;
      } else if (ownerName !== name || ownerId !== personid) {
        updateExpressResponseFromNativeError(
          res,
          new UnauthorizedAccessError('Only the owner of the layout can delete it'),
        );
        return;
      }
      next();
    } catch (error) {
      updateExpressResponseFromNativeError(res, error);
      return;
    }
  };
