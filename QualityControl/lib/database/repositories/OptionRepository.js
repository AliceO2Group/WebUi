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

import { BaseRepository } from './BaseRepository.js';

/**
 * @typedef {object} OptionAttributes
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {Date} created_at
 * @property {Date} updated_at
 */

/**
 * Repository class for managing Option entities.
 */
export class OptionRepository extends BaseRepository {
  constructor(optionModel) {
    super(optionModel);
  }

  /**
   * Retrieves option by name
   * @param {string} name The name of the option
   * @param {object} options additional options for the query (e.g. transaction)
   * @returns {Promise<Option>}
   */
  async findOptionByName(name, options = {}) {
    return this.model.findOne({ where: { name }, ...options });
  }
}
