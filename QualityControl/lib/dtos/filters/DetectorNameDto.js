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

/**
 * Joi validation schema for QcDetectorName filter (also known as detector when fetched from BKP and used in UI)
 * @type {Joi.StringSchema}
 */
export const DetectorNameDto = Joi.string()
  .uppercase()
  .length(3)
  .pattern(/^[A-Z]{3}$/)
  .messages({
    'string.base': 'Detector name must be a string',
    'string.uppercase': 'Detector name must be uppercase',
    'string.length': 'Detector name must be exactly 3 characters',
    'string.pattern.base': 'Detector name must contain only uppercase letters (e.g., TPC, ITS)',
  });
