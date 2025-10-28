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
export class MapStorage {
  constructor() {
    this.layoutStorage = new Map();
  }

  layoutStorage;

  /**
   * read func
   * @param {string} key - key
   * @returns {LayoutDomainStorage | undefined} found Layout
   */
  readLayout(key) {
    return this.layoutStorage.get(key);
  }

  /**
   * write func
   * @param {LayoutDomainStorage} layout - layout
   * @returns {string} - key
   */
  writeLayout(layout) {
    const mapKey = crypto.randomUUID();
    this.layoutStorage.set(mapKey, layout);
    return mapKey;
  }

  /**
   * delete func
   * @param {string} key - key
   * @returns {boolean} - true if deleted
   */
  deleteLayout(key) {
    return this.layoutStorage.delete(key);
  }

  /**
   * delete cached layout data by user id
   * @param {number} userId - userid
   */
  deleteByUserId(userId) {
    const found = this.layoutStorage.entries().filter((entry) => entry[1].downloadUserId == userId);
    found.forEach((entry) => {
      this.layoutStorage.delete(entry[0]);
    });
  }
}
