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
import { LayoutDomainStorage } from './classes/domain/LayoutDomainStorage.js';

/** @import { LayoutDomain } from './classes/domain/LayoutDomain.js'; */
/** @import { MapStorage } from './classes/domain/MapStorage.js'; */

/**
 * save download data to cache
 * @param {MapStorage} mapStorage - map storage used to store data from post request
 * @param {LayoutDomain} layoutDomain - layoutDomain data to store.
 * @param {number} userId - userId of user wanting to download.
 * @returns {`${string}-${string}-${string}-${string}-${string}`} - UUID key of Map entry
 */
export function saveDownloadData(mapStorage, layoutDomain, userId) {
  // Delete existing download Layout data.
  mapStorage.deleteByUserId(userId);
  const layoutDomainStorage = new LayoutDomainStorage(layoutDomain.id, layoutDomain.name, layoutDomain.tabs, userId);
  const insertedLayoutKey = mapStorage.writeLayout(layoutDomainStorage);
  return insertedLayoutKey;
}

/**
 * load saved data from cache
 * @param {MapStorage} mapStorage - map storage used to retrieve data from earlier post request
 * @param {string} key - UUID key of Map entry to retrieve layout by
 * @returns {LayoutDomainStorage | undefined} - found layout if any
 */
export function loadSavedData(mapStorage, key) {
  return mapStorage.readLayout(key);
}
