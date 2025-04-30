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

import { InvalidInputError, NotFoundError, updateAndSendExpressResponseFromNativeError } from '@aliceo2/web-ui';

/**
 * Middleware that checks if the layout id is present in the request
 * @param {LayoutService} layoutService - layout service
 * @returns  {function(req, res, next): Function} - middleware function
 */
export const layoutIdMiddleware = (layoutService) =>

/**
 * Returned middleware method
 * @param {Express.Request} req - HTTP Request
 * @param {Express.Response} res - HTTP Response
 * @param {Express.Next} next - HTTP Next (check pass)
 */
  async (req, res, next) => {
    const { id = '' } = req.params ?? {};
    try {
      if (!id) {
        throw new InvalidInputError('The "id" parameter is missing from the request');
      }
      const layout = await layoutService.getLayoutById(id);
      if (!layout) {
        throw new NotFoundError(`The layout with id "${id}" does not exist`);
      }

      next();
    } catch (error) {
      updateAndSendExpressResponseFromNativeError(res, error);
      return;
    }
  };
