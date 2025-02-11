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
import { IntegratedServices } from './../../../common/library/enums/Status/integratedServices.enum.js';

/**
 * Middleware to validate the component parameter in the request.
 * Returns 400 if the component is missing or invalid, otherwise calls next()
 * @param {Express.Request} req - HTTP Request
 * @param {Express.Response} res - HTTP Response
 * @param {Express.Next} next - HTTP Next (check pass)
 * @returns {void}
 */
export const statusComponentMiddleware = (req, res, next) => {
  const { service = '' } = req.params ?? {};
  try {
    if (!service) {
      throw new InvalidInputError('Component parameter is missing');
    } else if (!Object.values(IntegratedServices).includes(req.params.service)) {
      throw new InvalidInputError('Invalid component parameter');
    }
  } catch (error) {
    return updateAndSendExpressResponseFromNativeError(res, error);
  }
  next();
};
