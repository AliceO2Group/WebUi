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

import { InvalidInputError } from '@aliceo2/web-ui';
import { RunNumberDto } from '../../dtos/filters/RunNumberDto.js';

/**
 * Helper to validate and parse a run number.
 * Handles both Joi validation errors and native errors.
 * @param {string|number} runNumber - The run number to validate.
 * @returns {Promise<number|null>} - Returns the parsed run number, or null if error response was already sent.
 * @throws {InvalidInputError} - If the run number is invalid or missing.
 * @throws {Error} - If any other error occurs during validation.
 */
export const validateRunNumber = async (runNumber) => {
  try {
    if (runNumber === undefined) {
      throw new InvalidInputError('Run number is required');
    }

    const parsedRunNumber = parseInt(runNumber, 10);
    await RunNumberDto.validateAsync(parsedRunNumber);

    return parsedRunNumber;
  } catch (error) {
    if (error.isJoi) {
      throw new InvalidInputError(error.details[0].message);
    }
    throw error;
  }
};
