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

import { LogManager } from '@aliceo2/web-ui';
import { isObjectOfTypeChecker } from '../../common/library/qcObject/utils.js';
import QCObjectDto from '../dtos/QCObjectDto.js';
import QcObjectIdentificationDto from '../dtos/QcObjectIdentificationDto.js';

const LOG_FACILITY = 'qcg/obj-service';

/**
 * High-level service class for retrieving and composing object information from storage (CCDB/QCDB)
 * @class
 */
export class QcObjectService {
  /**
   * Setup service constructor and initialize needed dependencies
   * @param {CcdbService} dbService - CCDB service to retrieve raw information about the QC objects
   * @param {JsonFileService} dataService - service to be used for retrieving configurations on saved layouts
   * @param {RootService} rootService - root library to be used for interacting with ROOT Objects
   */
  constructor(dbService, dataService, rootService) {
    /**
     * @type {CcdbService}
     */
    this._dbService = dbService;

    /**
     *  @type {JsonFileService}
     */
    this._dataService = dataService;

    /**
     * @type {RootService}
     */
    this._rootService = rootService;

    /**
     * @constant
     * @type {string}
     */
    this._DB_URL = `${this._dbService._protocol}://${this._dbService._hostname}:${this._dbService._port}/`;

    this._cache = {
      objects: undefined,
      lastUpdate: undefined,
    };
    this._logger = LogManager.getLogger(LOG_FACILITY);
  }

  /**
   * Method to update list of objects paths currently stored in cache by a configured cache prefix
   * Prefix will not be accepted as passed parameter so that the configured file one is used
   * @returns {void}
   */
  async refreshCache() {
    try {
      const objects = await this._dbService.getObjectsLatestVersionList(this._dbService.CACHE_PREFIX);
      this._cache.objects = this._parseObjects(objects);
      this._cache.lastUpdate = Date.now();
    } catch (error) {
      this._logger.errorMessage(
        `Last update ${new Date(this._cache.lastUpdate)}; Unable to update cache - objects due to ${error}`,
        { level: 1, facility: LOG_FACILITY },
      );
    }
  }

  /**
   * Returns a list of objects (their latest version) based on a given prefix (e.g. 'qc'; default to config file
   * specified prefix); Fields wished to be requested for each object can be passed through the fields parameter;
   * If fields list is missing, a default list will be used: [name, created, lastModified]
   * The service can return objects either:
   * * from cache if it is requested by the client and the system is configured to use a cache;
   * * make a new request and get data directly from data service
   * * @example Equivalent of URL request: `/latest/qc/TPC/object.*`
   * @param {string|Regex} prefix - Prefix for which CCDB should search for objects.
   * @param {Array<string>} [fields = []] - List of fields that should be requested for each object
   * @param {boolean} [useCache = true] - if the list should be the cached version or not
   * @returns {Promise.<Array<QcObjectLeaf>>} - results of objects with required fields
   * @rejects {Error}
   */
  async retrieveLatestVersionOfObjects(prefix = this._dbService.PREFIX, fields = [], useCache = true) {
    if (useCache && this._cache?.objects) {
      return this._cache.objects.filter((object) => object.name.startsWith(prefix));
    } else {
      const objects = await this._dbService.getObjectsLatestVersionList(prefix, fields);
      return this._parseObjects(objects);
    }
  }

  /**
   * Using `browse` option, request a list of versions(identifications) for a specified path for an object.
   * Use the first version to retrieve details about the exact object.
   * From the information retrieved above, use the location attribute and pass it to JSROOT to get a JSON
   * decompressed version of the ROOT object which will be plotted/drawn with JSROOT.draw on the client side.
   * @param {string} path - name(known as path) of the object to retrieve information
   * @param {number|null} [validFrom = undefined] - timestamp in ms
   * @param {string} [id = ''] - id with respect to CCDB storage
   * @param {string} [filters = {}] - filter attributes for specific objects
   * @returns {Promise<QcObject>} - QC objects with information CCDB and root
   * @throws {Error}
   */
  async retrieveQcObject(path, validFrom = undefined, id = undefined, filters = {}) {
    /**
     * @type {CcdbObjectIdentification}
     */
    let identification = { path, validFrom, id, filters };
    if (!validFrom) {
      /*
       * If no validFrom timestamp was provided, it means the exact version of the object is unknown.
       * Thus, we need to query versions of the object before retrieving details of the latest version of the object.
       */
      const rawIdentification = await this._dbService.getObjectIdentification({ path, filters });
      Object.assign(identification, rawIdentification);
      identification = QcObjectIdentificationDto.fromGetFormat(identification);
    }
    const objectDetails = await this._dbService.getObjectDetails(identification);
    const object = QCObjectDto.toStandardObject(objectDetails);

    const rootObj = await this._getJsRootFormat(this._DB_URL + object.location);

    /**
     * @type {CcdbObjectIdentification}
     */
    const partialIdentification = {
      path,
      filters,
    };
    // Partial identification to retrieve various versions of an object with specified name and metadata attributes
    let versions = await this._dbService.getObjectVersions(partialIdentification, 1000);
    versions = versions.map((version) => QcObjectIdentificationDto.fromGetFormat(version));
    return {
      ...object,
      root: rootObj,
      versions,
    };
  }

  /**
   * Retrieve an object by its id (stored in the customized data service) with its information
   * @param {string} qcgId - id of the object configuration stored in QCG database (different than CCDB)
   * @param {string} id - id of the object to be retrieved as per CCDB etag
   * @param {number|null} [validFrom] - timestamp in ms
   * @param {string} [filters = {}] - filter as string to be sent to CCDB
   * @returns {Promise<QcObject>} - QC objects with information CCDB and root
   * @throws
   */
  async retrieveQcObjectByQcgId(qcgId, id, validFrom = undefined, filters = {}) {
    const { object, layoutName } = this._dataService.getObjectById(qcgId);
    const { name, options = {}, ignoreDefaults = false } = object;
    const qcObject = await this.retrieveQcObject(name, validFrom, id, filters);

    return {
      ...qcObject,
      layoutDisplayOptions: options,
      layoutName,
      ignoreDefaults,
    };
  }

  /**
   * Retrieves a root object from url-location provided and parses it depending on its type:
   * * if it is a checker, uses default JSON utility to parse it and replace 'bigint' with string
   * * if of ROOT type, uses jsroot.toJSON
   * @param {string} url - location of Root file to be retrieved
   * @returns {Promise<JSON.Error>} - JSON version of the object
   */
  async _getJsRootFormat(url) {
    const file = await this._rootService.openFile(`${url}+`);
    const root = await file.readObject('ccdb_object');
    root['_typename'] = root['mTreatMeAs'] || root['_typename'];

    if (isObjectOfTypeChecker(root)) {
      /**
       * Due to QC Checker big ints, JSON utility has to be overridden to parse 'bigint' types and replace with string
       */
      return JSON.parse(JSON.stringify(root, (_, value) => typeof value === 'bigint' ? value.toString() : value));
    }

    const rootJson = await this._rootService.toJSON(root);
    return rootJson;
  }

  /**
   * Given a list of objects form CCDB, parse, filter and keep only valid objects.
   * Use `for loop` to iterate only once rather than chained array operations as we expect lots of objects
   * @param {Array<object>} objects - objects to be filtered
   * @returns {Array<QcObjectLeaf>} - list of objects parsed and filtered
   */
  _parseObjects(objects) {
    const list = [];
    for (const object of objects) {
      if (QCObjectDto.isObjectPathValid(object)) {
        list.push(QCObjectDto.toQcObjectLeaf(object));
      }
    }
    return list;
  }

  /**
   * Check the database service and return the interval specified for refreshing the cache
   * @returns {number} - ms for interval to refresh cache
   */
  getCacheRefreshRate() {
    return this._dbService.CACHE_REFRESH_RATE;
  }
}
