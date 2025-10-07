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
 * Joi schema for validating user session
 */
export const UserSessionDto = Joi.object({
  personid: Joi.number()
    .required()
    .messages({
      'any.required': 'id of the user is mandatory',
      'number.base': 'id of the user must be a number',
    }),
  username: Joi.string()
    .required()
    .messages({ 'any.required': 'username of the user is mandatory' }),
  name: Joi.string()
    .required()
    .messages({ 'any.required': 'name of the user is mandatory' }),
});
