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

import { NotFoundError, UnauthorizedAccessError, updateAndSendExpressResponseFromNativeError } from '@aliceo2/web-ui';

/**
 * @typedef {import('../../services/layout/LayoutService.js').LayoutService} LayoutService
 * @typedef {import('../../services/layout/UserService.js').UserService} UserService
 */

/**
 * Middleware that checks if the requestor is the owner of the layout
 * @param {LayoutService} layoutService Service that handles layouts business logic
 * @param {UserService} userService Service that handles user business logic
 * @returns {(req: Express.Request,
 * res: Express.Response,
 * next: Express.NextFunction) => Promise<void>} - middleware function
 */
export const layoutOwnerMiddleware = (layoutService, userService) =>

/**
 * Returned middleware method
 * @param {Express.Request} req - HTTP Request
 * @param {Express.Response} res - HTTP Response
 * @param {Express.Next} next - HTTP Next (check pass)
 */
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { personid = '', username = '' } = req.session ?? {};
      if (personid === '' || username === '') {
        throw new UnauthorizedAccessError('Unable to retrieve session information');
      }
      const { owner_username } = await layoutService.getLayoutById(id) ?? {};
      const ownerId = await userService.getOwnerIdByUsername(owner_username);
      if (ownerId === '' || owner_username === '') {
        throw new NotFoundError('Unable to retrieve layout owner information');
      }
      if (owner_username !== username || ownerId !== personid) {
        throw new UnauthorizedAccessError('Only the owner of the layout can make changes to this layout');
      }
      next();
    } catch (error) {
      updateAndSendExpressResponseFromNativeError(res, error);
      return;
    }
  };
