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
import { ObjectPathDto } from './ObjectPathDto.js';

const ALLOWED_LAYOUT_FIELDS = [
  'isOfficial',
  'autoTabChange',
  'collaborators',
  'description',
  'displayTimestamp',
  'id',
  'name',
  'owner_id',
  'owner_name',
  'tabs',
];

/**
 * Parses a comma-separated string of field names and validates them against allowed values.
 * @param {string} value - The comma-separated string of field names to validate
 * @param {Joi.CustomHelpers} helpers - Joi validation helpers object
 * @returns {string[]} Array of validated field names
 * @throws {Joi.ValidationError} Throws validation error if any field is not allowed
 */
function parseAndValidateFields(value, helpers) {
  const fields = value.split(',');
  const invalidFields = fields.filter((field) => !ALLOWED_LAYOUT_FIELDS.includes(field));

  return invalidFields.length > 0 ?
    helpers.error('any.invalid', { value: invalidFields[0] }) : fields;
}

const ObjectDto = Joi.object({
  id: Joi.number(),
  name: Joi.string().required(),
  x: Joi.number().min(0).default(0),
  y: Joi.number().min(0).default(0),
  h: Joi.number().min(0).default(0),
  w: Joi.number().min(0).default(0),
  options: Joi.array().items(Joi.string()).default([]),
  autoSize: Joi.boolean().default(false),
  ignoreDefaults: Joi.boolean().default(false),
});

const TabsDto = Joi.object({
  id: Joi.number(),
  name: Joi.string().min(1).max(50).required(),
  columns: Joi.number().min(1).max(5).default(2),
  objects: Joi.array().max(30).items(ObjectDto).default([]),
});

export const UserDto = Joi.object({
  id: Joi.number().min(0).required(),
  name: Joi.string().required(),
});

export const LayoutDto = Joi.object({
  id: Joi.number(),
  name: Joi.string().min(3).max(40).required(),
  tabs: Joi.array().min(1).max(45).items(TabsDto).required(),
  owner_id: Joi.number().min(0).required(),
  owner_name: Joi.string().required(),
  description: Joi.string().min(0).max(100).optional(),
  collaborators: Joi.array().items(UserDto).default([]),
  displayTimestamp: Joi.boolean().default(false),
  autoTabChange: Joi.number().min(0).max(600).default(0),
});

/**
 * Schema specifically meant to validate incomming getLayouts requests
 */
export const LayoutsGetDto = Joi.object({
  owner_id: Joi.number().integer().optional(),
  name: Joi.string().optional(),
  filter: Joi.object({
    objectPath: ObjectPathDto,
  }).optional(),
  token: Joi.string().required(),
  fields: Joi.string()
    .custom(parseAndValidateFields, 'Field validation')
    .optional()
    .messages({
      'any.invalid': '{{#label}} contains invalid field: {#value}',
    }),
});
