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
 * @typedef {import('../../repositories/LayoutRepository.js').LayoutRepository} LayoutRepository
 */

/**
 * Middleware that checks if the requestor is the owner of the layout
 * @param {LayoutRepository} layoutRepository - Repository for getting/setting layout data
 * @returns  {function(req, res, next): Function} - middleware function
 */
export const layoutOwnerMiddleware = (layoutRepository) =>

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
      const { owner_name = '', owner_id = '' } = await layoutRepository.readLayoutById(id) ?? {};
      if (owner_id === '' || owner_name === '') {
        throw new NotFoundError('Unable to retrieve layout owner information');
      } else if (personid === '' || name === '') {
        throw new NotFoundError('Unable to retrieve session information');
      } else if (owner_name !== name || owner_id !== personid) {
        throw new UnauthorizedAccessError('Only the owner of the layout can delete it');
      }
      next();
    } catch (error) {
      updateAndSendExpressResponseFromNativeError(res, error);
      return;
    }
  };
