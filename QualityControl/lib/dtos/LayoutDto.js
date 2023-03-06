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

const ObjectDto = Joi.object({
  id: Joi.string().required(),
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
  id: Joi.string().required(),
  name: Joi.string().min(1).max(10).required(),
  columns: Joi.number().min(2).max(5).default(2),
  objects: Joi.array().max(30).items(ObjectDto).default([]),
});

const UserDto = Joi.object({
  id: Joi.number().min(0).required(),
  name: Joi.string().required(),
});

export const LayoutDto = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().min(3).max(40).required(),
  tabs: Joi.array().min(1).max(45).items(TabsDto).required(),
  owner_id: Joi.number().min(0).required(),
  owner_name: Joi.string().required(),
  collaborators: Joi.array().items(UserDto).default([]),
  displayTimestamp: Joi.boolean().default(false),
  autoTabChange: Joi.number().min(0).max(600).default(0),
});
