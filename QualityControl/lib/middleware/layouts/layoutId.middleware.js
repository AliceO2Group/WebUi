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
 * @typedef {import('../../repositories/LayoutRepository.js').LayoutRepository} LayoutRepository
 */

/**
 * Middleware that checks if the layout id is present in the request
 * @param {LayoutRepository} layoutRepository - repository for getting/setting layout data
 * @returns  {function(req, res, next): Function} - middleware function
 */
export const layoutIdMiddleware = (layoutRepository) =>

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
      await layoutRepository.readLayoutById(id);
      next();
    } catch (error) {
      updateAndSendExpressResponseFromNativeError(res, error);
      return;
    }
  };
