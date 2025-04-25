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

import { LogManager } from '@aliceo2/web-ui';

/**
 * BaseRepository serves as a generic repository class for managing a specific model.
 */
export class BaseRepository {
  /**
   * Initializes a new instance of the repository with the specified model.
   * @param {object} model - The Sequelize model to be used by the repository.
   */

  constructor(model) {
    this._model = model;
    this._logger = LogManager.getLogger('qcg/repository');
  }
}
