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

import { validateRunNumber } from '../helpers/validateRunNumber.js';

/**
 * Middleware function to validate the run number if in run mode.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {Promise<void>}
 */
export const runModeMiddleware = async (req, res, next) => {
  const { inRunMode = false, filters = {} } = req.query;
  if (!inRunMode) {
    return next();
  }

  const parsedRunNumber = await validateRunNumber(filters?.RunNumber, res);
  if (parsedRunNumber === null) {
    return;
  }

  req.query.filters.RunNumber = parsedRunNumber;
  next();
};
