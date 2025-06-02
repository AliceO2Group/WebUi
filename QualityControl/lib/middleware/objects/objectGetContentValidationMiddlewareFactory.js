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
import { createObjectGetDtos } from '../../dtos/ObjectGetDto.js';

const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/object-middleware`);

/**
 * Factory function to create object validation middleware with dynamic RUN_TYPES
 * @param {FilterService} filterService - Service providing run types
 * @returns {function(req, res, next): undefined} - Express middleware function
 */
export function objectGetContentsValidationMiddlewareFactory(filterService) {
  const { runTypes } = filterService;
  const { ObjectContentsGetDto } = createObjectGetDtos(runTypes);

  const getObjectContentValidator = async (req, res, next) => {
    try {
      req.query = ObjectContentsGetDto.validateAsync(req.query);
      next();
    } catch (error) {
      const responseError = new InvalidInputError(`Invalid query parameters: ${error.details[0].message}`);

      logger.errorMessage(`Error validating query parameters: ${error}`);
      updateAndSendExpressResponseFromNativeError(res, responseError);
    }
  };

  return getObjectContentValidator;
}
