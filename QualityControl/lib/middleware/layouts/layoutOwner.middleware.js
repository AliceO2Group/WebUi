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

import {
  InvalidInputError,
  NotFoundError,
  UnauthorizedAccessError,
  updateAndSendExpressResponseFromNativeError,
} from '@aliceo2/web-ui';
import { UserDto } from '../../dtos/LayoutDto.js';

/**
 * @typedef {import('../../services/layout/LayoutService').LayoutService} LayoutService
 */

/**
 * Middleware that checks if the requestor is the owner of the layout
 * @param {LayoutService} layoutService - Service for getting/setting layout data
 * @returns  {function(req, res, next): Function} - middleware function
 */
export const layoutOwnerMiddleware = (layoutService) =>

/**
 * Returned middleware method
 * @param {Express.Request} req - HTTP Request
 * @param {Express.Response} res - HTTP Response
 * @param {Express.Next} next - HTTP Next (check pass)
 */
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!req.session) {
        throw new NotFoundError('Session not found');
      }

      const { personid, name } = req.session;
      try {
        await UserDto.validateAsync({ id: personid, name });
      } catch (error) {
        if (error.isJoi) {
          throw new InvalidInputError('User could not be validated');
        }
      }

      const layout = await layoutService.getLayoutById(id);
      const owner = layout?.owner;
      if (owner?.id == null || owner?.name == null || owner.id === '' || owner.name === '') {
        throw new NotFoundError('Unable to retrieve layout owner information');
      }

      if (owner.name !== name || owner.id !== personid) {
        throw new UnauthorizedAccessError('Only the owner of the layout can delete it');
      }

      next();
    } catch (error) {
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  };
