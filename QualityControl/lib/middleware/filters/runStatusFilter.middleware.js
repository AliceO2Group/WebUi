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
import { RunNumberDto } from '../../dtos/filters/RunNumberDto.js';

/**
 * Middleware function to validate the run number and attach it to the request object.
f
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>}
 */
export const runStatusFilterMiddleware = async (req, res, next) => {
  try {
    const validatedRunNumber = await RunNumberDto.validateAsync(req.params.runNumber);
    req.params.runNumber = validatedRunNumber;
    next();
  } catch (error) {
    updateAndSendExpressResponseFromNativeError(
      res,
      error.isJoi
        ? new InvalidInputError(error.details[0].message)
        : error,
    );
  }
};
