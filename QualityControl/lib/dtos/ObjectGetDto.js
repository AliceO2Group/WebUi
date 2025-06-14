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
 * Creates and returns a filters schema for object DTOs
 * @param {Array<string>} runTypes - Array of valid run types
 * @returns {Joi.ObjectSchema} Joi validation schema for filters
 */
function createFiltersSchema(runTypes) {
  return Joi.object({
    RunNumber: Joi.number().integer().min(0).max(999999).optional(),
    RunType: runTypes.length > 0
      ? Joi.string().valid(...runTypes).optional()
      : Joi.string().optional(),
    PeriodName: Joi.string().pattern(periodNamePattern).optional(),
    PassName: Joi.string().optional(),
  }).optional();
}

/**
 * Creates and returns the base object get schema
 * @param {Array<string>} runTypes - Array of valid run types
 * @returns {Joi.ObjectSchema} Joi validation schema for base object get
 */
function createBaseObjectGetDto({ runTypes }) {
  return Joi.object({
    token: Joi.string().required(),
    id: Joi.string().optional(),
    validFrom: Joi.number().optional().min(0),
    filters: createFiltersSchema(runTypes),
  }).options({ allowUnknown: false });
}

/**
 * Creates and returns the base objects get schema
 * @param {Array<string>} runTypes - Array of valid run types
 * @returns {Joi.ObjectSchema} Joi validation schema for base objects get
 */
function createBaseObjectsGetDto({ runTypes }) {
  return Joi.object({
    token: Joi.string().required(),
    fields: Joi.array().default([]).items(Joi.string()),
    filters: createFiltersSchema(runTypes),
  }).options({ allowUnknown: false });
}

/**
 * Creates and returns the ObjectsGetDto schema
 * @param {Array<string>} runTypes - Array of valid run types
 * @returns {Joi.ObjectSchema} Joi validation schema for getting multiple objects
 */
export function createObjectsGetDto({ runTypes }) {
  return createBaseObjectsGetDto({ runTypes }).keys({
    prefix: Joi.string(),
  });
}

/**
 * Creates and returns the ObjectContentsGetDto schema
 * @param {Array<string>} runTypes - Array of valid run types
 * @returns {Joi.ObjectSchema} Joi validation schema for getting object contents
 */
export function createObjectContentsGetDto({ runTypes }) {
  return createBaseObjectGetDto({ runTypes }).keys({
    path: Joi.string().required(),
  });
}

/**
 * Creates and returns the ObjectGetByIdDto schema
 * @param {Array<string>} runTypes - Array of valid run types
 * @returns {Joi.ObjectSchema} Joi validation schema for getting an object by ID
 */
export function createObjectGetByIdDto({ runTypes }) {
  return createBaseObjectGetDto({ runTypes }); // doesn't require any alterations.
}

/**
 * Joi validation schema for object ID in URL
 */
export const qcgIdDto = Joi.string().required().trim().min(1).messages({ 'string.empty': 'Missing object ID in URL' });
