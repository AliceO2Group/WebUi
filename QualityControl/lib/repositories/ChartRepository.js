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

import { BaseRepository } from './BaseRepository.js';

/**
 * ChartRepository class to handle CRUD operations for Charts.
 */
export class ChartRepository extends BaseRepository {
  constructor(jsonFileService) {
    super(jsonFileService);
  }

  /**
   * Return an object by its id that is saved within a layout
   * @param {string} id - id of the object to retrieve
   * @returns {{object: object, layoutName: string}} - object configuration stored
   */
  getObjectById(id) {
    if (!id) {
      throw new Error('Missing mandatory parameter: id');
    }
    for (const layout of this._jsonFileService.data.layouts) {
      for (const tab of layout.tabs) {
        for (const object of tab.objects) {
          if (object.id === id) {
            return { object, layoutName: layout.name, tabName: tab.name };
          }
        }
      }
    }
    throw new Error(`Object with ${id} could not be found`);
  }
}
