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

import { InvalidInputError, LogManager, updateAndSendExpressResponseFromNativeError } from '@aliceo2/web-ui';
import { LayoutsGetDto } from '../../dtos/LayoutDto.js';
const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/get-layout-mw`;

/**
 * Middleware that checks if the query is valid in the request
 * @param {Express.Request} req - HTTP Request
 * @param {Express.Response} res - HTTP Response
 * @param {Express.Next} next - HTTP Next (check pass)
 * @returns {Promise<void>} Resolves when validation is done and next is called
 */
export const getLayoutsMiddleware = async (req, res, next) => {
  const logger = LogManager.getLogger(LOG_FACILITY);
  try {
    const validated = await LayoutsGetDto.validateAsync(req.query);
    req.query = validated;
    next();
  } catch (error) {
    logger.errorMessage(`Error validating layout: ${error.message || error}`);
    const responseError = error.isJoi ?
      new InvalidInputError(`Invalid query parameters: ${error.details[0].message}`) :
      new Error('Unable to process request');
    updateAndSendExpressResponseFromNativeError(res, responseError);
    return;
  }
};
