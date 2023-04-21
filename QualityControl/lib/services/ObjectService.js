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

import { isObjectOfTypeChecker } from './../../common/library/qcObject/utils.js';
import QCObjectDto from './../dtos/QCObjectDto.js';

/**
 * Service class for retrieving and composing object information
 * @class
 */
export class ObjectService {
  /**
   * Setup service constructor and initialize needed dependencies
   * @constructor
   * @param {CcdbService} dbService - CCDB service to retrieve
   * @param {JsonFileService} dataService - service to be used for retrieving customized information
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
    this._DB_URL = `${this._dbService.protocol}://${this._dbService.hostname}:${this._dbService.port}/`;
  }

  /**
   * Returns a list of objects (their latest version) based on a given prefix (e.g. 'qc'; default to config file
   * specified prefix); Fields wished to be requested for each object can be passed through the fields parameter;
   * If fields list is missing, a default list will be used: [name, created, lastModified]
   * * @example Equivalent of URL request: `/latest/qc/TPC/object.*`
   * @param {string} prefix - Prefix for which CCDB should search for objects
   * @param {Array<string>} [fields=[]] - List of fields that should be requested for each object
   * @returns {Promise.<Array<object>>} - results of objects with required fields
   * @throws {Error}
   */
  async getLatestVersionOfObjects(prefix, fields = []) {
    const objects = await this._dbService.getObjectsLatestVersionList(prefix, fields);
    return objects.filter(QCObjectDto.isObjectPathValid)
      .map(QCObjectDto.toStandardObject);
  }

  /**
   * Using `browse` option, request a list of `last-modified` and `valid-from` for a specified path for an object
   * Use the first `validFrom` option to make a head request to CCDB; Request which will in turn return object
   * information and download the root file locally on CCDB if it is not already there;
   * From the information retrieved above, use the location with JSROOT to get a JSON object
   * Use JSROOT to decompress a ROOT object content and convert it to JSON to be sent back to the client for
   * interpretation with JSROOT.draw
   * @param {string} objectName - name(known as path) of the object to retrieve information
   * @param {number} [timestamp = -1] - timestamp in ms
   * @param {string} [filter = ''] - filter as string to be sent to CCDB
   * @returns {Promise<QcObject>} - QC objects with information CCDB and root
   * @throws
   */
  async getObject(objectName, timestamp = -1, filter = '') {
    const validFrom = await this._dbService.getObjectValidity(objectName, timestamp, filter);
    const object = await this._dbService.getObjectDetails(objectName, validFrom, filter);
    const rootObj = await this._getJsRootFormat(this._DB_URL + object.location);
    const timestampList = await this._dbService.getObjectTimestampList(objectName, 1000, filter);

    return {
      ...object,
      root: rootObj,
      timestamps: timestampList,
    };
  }

  /**
   * Retrieve an object by its id (stored in the customized data service) with its information
   * @param {string} id - id of the object to be retrieved
   * @param {number} [timestamp = -1] - timestamp in ms
   * @param {string} [filter = ''] - filter as string to be sent to CCDB
   * @returns {Promise<QcObject>} - QC objects with information CCDB and root
   * @throws
   */
  async getObjectById(id, timestamp = -1, filter = '') {
    const { name, options = {}, ignoreDefaults = false } = this._dataService.getObjectById(id);
    const object = await this.getObject(name, timestamp, filter);

    return {
      ...object,
      layoutDisplayOptions: options,
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
    const file = await this._rootService.openFile(url);
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
}
