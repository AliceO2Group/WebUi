/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import assert from 'assert';

/**
 * @typedef {import('../services/JsonFileService.js').JsonFileService} JsonFileService
 */

export class BaseRepository {
  /**
   * Initializes the Json File Service.
   * @param {JsonFileService} jsonFileService - Service to interact with the JSON database.
   * @throws {Error} Throws an error if jsonFileService is not provided.
   */
  constructor(jsonFileService) {
    assert(jsonFileService, 'Missing service for retrieving layout data');
    this._jsonFileService = jsonFileService;
  }
}
