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

import {Observable} from '/js/src/index.js';

/**
 * Model namespace for Folder type,
 * and search them.
 */
export default class Folder extends Observable {
  /**
   * Initialize with empty values
   * @param {string} model
   * @param {boolean} isOpened
   */
  constructor(model) {
    super();
    this.model = model;
    this.map = new Map();
  }

  /**
   * Add new folder and return if it was successful or not
   * @param {JSON} folder
   * @return {boolean}
   */
  addFolder(folder) {
    if (!folder.title || folder.title.trim() === '') {
      return false;
    }
    if (folder.isOpened === null || folder.isOpened === 'undefined') {
      folder.isOpened = false;
    }
    const folderExistsAlready = this.map.get(folder.title);
    if (folderExistsAlready) {
      return false;
    }

    this.map.set(folder.title, folder);
    this.notify();
    return true;
  }

  /**
   * Method to close/open a folder
   * @param {string} title
   * @return {boolean}
   */
  toggleFolder(title) {
    const state = this.map.get(title).isOpened;
    this.map.get(title).isOpened = !state;
    this.notify();
    return !state;
  }
}
