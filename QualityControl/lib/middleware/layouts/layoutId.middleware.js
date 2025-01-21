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

import { InvalidInputError } from '@aliceo2/web-ui';
import { updateExpressResponseFromNativeError } from '../../errors/updateExpressResponseFromNativeError.js';

/**
 * Middleware that checks if the layout id is present in the request
 * @param {JSONFileConnector} dataService - service for getting/setting layout data
 * @returns  {function(req, res, next): Function} - middleware function
 */
export const layoutIdMiddleware = (dataService) =>

/**
 * Returned middleware method
 * @param {Express.Request} req - HTTP Request
 * @param {Express.Response} res - HTTP Response
 * @param {Express.Next} next - HTTP Next (check pass)
 */
  async (req, res, next) => {
    const { id = '' } = req.params ?? {};
    if (!id) {
      updateExpressResponseFromNativeError(
        res,
        new InvalidInputError('The "id" parameter is missing from the request'),
      );
      return;
    }
    try {
      await dataService.readLayout(id);
      next();
    } catch (error) {
      updateExpressResponseFromNativeError(res, error);
      return;
    }
  };
