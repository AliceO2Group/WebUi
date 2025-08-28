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

/**
 * RunNumber DTO for validating run numbers
 */
export class RunNumberDto {
  /**
   * Creates a RunNumberDto from input, parsing and validating it
   * @param {number|string} runNumber - The input to parse and validate
   * @returns {number} The validated run number
   * @throws {Error} If input cannot be parsed or is invalid
   */
  static validateRunNumber(runNumber) {
    if (runNumber === undefined || runNumber === null || runNumber === '') {
      throw new InvalidInputError('Run number is required when in run mode');
    }

    let parsedValue = null;
    if (typeof runNumber === 'string') {
      parsedValue = parseInt(runNumber, 10);
      if (isNaN(parsedValue)) {
        throw new InvalidInputError('Run number must be a valid number');
      }
    } else if (typeof runNumber === 'number') {
      parsedValue = runNumber;
    } else {
      throw new InvalidInputError('Run number must be a number');
    }

    if (!Number.isInteger(parsedValue) || parsedValue < 0) {
      throw new InvalidInputError('Run number must be an integer greater than or equal to 0');
    }

    return parsedValue;
  }
}
