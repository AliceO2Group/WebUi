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

import Joi from 'joi';

const periodNamePattern = /^LHC\d{1,2}[a-z]+$/i;

/**
 * Creates a set of Joi validation schemas for object-related DTOs (Data Transfer Objects)
 * @param {string[]} runTypes - Array of valid run types to be used for validation
 * @returns {object} An object containing multiple Joi validation schemas:
 *   - ObjectsGetDto: Schema for getting multiple objects
 *   - ObjectContentsGetDto: Schema for getting object contents
 *   - ObjectGetByIdDto: Schema for getting an object by ID
 *   - qcgIdDto: Schema for validating object ID in URL
 */
export function createObjectGetDtos(runTypes) {
  const filterValidators = {
    RunNumber: (number) => {
      const parsed = parseInt(number, 10);
      return !isNaN(parsed) && parsed >= 0 && parsed < 1000000;
    },
    RunType: (type) => runTypes.length === 0 || runTypes.includes(type), // If there are no RunTypes, anything goes
    PeriodName: (periodName) => periodNamePattern.test(periodName),
    PassName: (name) => typeof name === 'string',
  };

  const validateFilters = (value, helpers) => {
    for (const [key, val] of Object.entries(value)) {
      const validator = filterValidators[key];

      if (!validator) {
        return helpers.error('filters.unknownField', { field: key });
      }

      if (!validator(val)) {
        return helpers.error(`filters.${key}.invalid`);
      }
    }
    return value;
  };

  const filters = Joi.object()
    .optional()
    .custom(validateFilters)
    .messages({
      'filters.RunNumber.invalid': 'RunNumber must be a number between 0 and 999999',
      'filters.RunType.invalid': `RunType must be one of: ${runTypes.join(', ')}`,
      'filters.PeriodName.invalid': 'PeriodName must match pattern LHC followed by 1-2 digits and letters',
      'filters.PassName.invalid': 'PassName must be a string',
      'filters.unknownField': 'Unknown filter field: {{#field}}',
    });

  const baseObjectGetDto = Joi.object({ // Singular
    token: Joi.string().required(),
    id: Joi.string().optional(),
    validFrom: Joi.number().optional().min(0),
    filters,
  }).options({ allowUnknown: false });

  const baseObjectsGetDto = Joi.object({ // Plural
    token: Joi.string().required(),
    fields: Joi.array().default([]).items(Joi.string()),
    filters,
  }).options({ allowUnknown: false });

  return {
    ObjectsGetDto: baseObjectsGetDto.keys({ prefix: Joi.string() }),
    ObjectContentsGetDto: baseObjectGetDto.keys({ path: Joi.string().required() }),
    ObjectGetByIdDto: baseObjectGetDto, // They are effectively identical;
    qcgIdDto: Joi.string().required().trim().min(1).messages({ 'string.empty': 'Missing object ID in URL' }),
  };
}
