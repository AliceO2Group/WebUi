import { LayoutDomainStorage } from '../classes/domain/LayoutDomainStorage.js';
// eslint-disable-next-line no-unused-vars
import { LayoutDomain } from './classes/domain/LayoutDomain.js';
// eslint-disable-next-line no-unused-vars
import { MapStorage } from './classes/domain/MapStorage.js';

/**
 * save download data to cache
 * @param {MapStorage} mapStorage
 * @param {LayoutDomain} layoutDomain
 * @param {number} userId
 * @returns {`${string}-${string}-${string}-${string}-${string}`}
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
 * @param {MapStorage} mapStorage
 * @param {string} key
 * @returns {LayoutDomainStorage | undefined}
 */
export function loadSavedData(mapStorage, key) {
  return mapStorage.readLayout(key);
}
