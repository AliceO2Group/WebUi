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
import { LayoutDto } from '../../dtos/LayoutDto.js';
import { LayoutPatchDto } from '../../dtos/LayoutPatchDto.js';
const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/validate-layout-mw`;

/**
 * Middleware for validating request bodies with context (create/update/etc.)
 * @param {Express.Request} req - HTTP Request
 * @param {Express.Response} res - HTTP Response
 * @param {Express.Next} next - HTTP Next (check pass)
 * @param {"create"|"update"|"delete"} action
 * @param {Joi.ObjectSchema<any>} dto DTO to validate the body against
 * @returns {Promise<void>} Resolves when validation is done and next is called
 */
const validateLayoutWithAction = (action, dto) => async (req, res, next) => {
  const logger = LogManager.getLogger(LOG_FACILITY);
  try {
    const validated = await dto.validateAsync(req.body);
    req.body = { ...validated };
    next();
  } catch (error) {
    logger.errorMessage(`Error validating layout [${action}]: ${error.message || error}`);
    const responseError = error.isJoi
      ? new InvalidInputError(`Invalid body for ${action}: ${error.details[0].message}`)
      : new Error(`Unable to ${action} layout`);
    updateAndSendExpressResponseFromNativeError(res, responseError);
    return;
  }
};

export const validateCreateLayoutMiddleware = validateLayoutWithAction('create', LayoutDto);
export const validateUpdateLayoutMiddleware = validateLayoutWithAction('update', LayoutDto);
export const validatePatchLayoutMiddleware = validateLayoutWithAction('patch', LayoutPatchDto);
