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

import { InvalidInputError, updateAndSendExpressResponseFromNativeError } from '@aliceo2/web-ui';

/**
 * @typedef {import('../../database/repositories/LayoutRepository.js').LayoutRepository} LayoutRepository
 */

/**
 * Middleware that checks if the layout id is present in the request
 * @param {Express.Request} req - HTTP Request
 * @param {Express.Response} res - HTTP Response
 * @param {Express.Next} next - HTTP Next (check pass)
 * @param layoutService
 * @returns {Promise<void>} Resolves when validation is done and next is called
 */
export const layoutIdMiddleware = (layoutService) => async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id.trim() === '') {
      throw new InvalidInputError('Layout id is required');
    }
    const layout = await layoutService.getLayoutById(id);
    req.layout = layout;
    next();
  } catch (error) {
    updateAndSendExpressResponseFromNativeError(res, error);
    return;
  }
};
