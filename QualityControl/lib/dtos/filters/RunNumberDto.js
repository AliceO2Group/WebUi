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

export const RunNumberDto = Joi.number()
  .required()
  .integer()
  .min(0)
  .max(999999)
  .messages({
    'any.required': 'Run number is required',
    'number.base': 'Run number must be a number',
    'number.integer': 'Run number must be an integer',
    'number.min': 'Run number must be positive',
    'number.max': 'Run number must not exceed 999999',
  });
