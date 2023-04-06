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

import { Log } from '@aliceo2/web-ui';
const log = new Log(`${process.env.npm_config_log_label ?? 'qcg'}/ccdb`);
import QCObjectDto from './../dtos/QCObjectDto.js';
import { httpHeadJson, httpGetJson, errorLogger } from './../utils/utils.js';

/**
 * Gateway for all CCDB calls
 * @class
 */
export class CcdbService {
  /**
   * Setup CCDB Service
   * @constructor
   * @param {Object} config - {hostname, port}
   */
  constructor(config) {
    if (!config) {
      throw new Error('Empty CCDB config');
    }
    if (!config.hostname) {
      throw new Error('Empty hostname in CCDB config');
    }
    if (!config.port) {
      throw new Error('Empty port in CCDB config');
    }

    this.hostname = config.hostname;
    this.port = config.port;
    this.protocol = config.protocol ?? 'http';
    this.PREFIX = this._getPrefix(config);

    this.LAST_MODIFIED = 'Last-Modified';
    this.VALID_FROM = 'Valid-From';
    this.CREATED = 'Created';
    this.PATH = 'path';

    this.DRAWING_OPTIONS = 'drawOptions';
    this.DISPLAY_HINTS = 'displayHints';
    this.CONTENT_LOCATION = 'content-location';
    this.LOCATION = 'location';

    this.HEADERS = {
      Accept: 'application/json',
      'X-Filter-Fields': `${this.PATH},${this.CREATED},${this.LAST_MODIFIED}`,
    };
  }

  /**
   * Check connection to CCDB service is up and running by requesting a list of sub-folders with a limit of 1;
   * Such a request is fast as it contains almost no data ;
   * @returns {Promise.<Boolean, Error>} - promise with results of the query to ccdb
   */
  async isConnectionUp() {
    const connectionHeaders = { Accept: 'application/json', 'X-Filter-Fields': `${this.PATH}`, 'Browse-Limit': 1 };
    const url = `/browse/${this.PREFIX}`;
    try {
      await httpGetJson(this.hostname, this.port, url, connectionHeaders);
      log.info('CCDB connection is up and running');
      return true;
    } catch (error) {
      errorLogger(error, 'ccdb');
      throw new Error(`Unable to connect to CCDB due to: ${error}`);
    }
  }

  /**
   * Returns a list of objects (their latest version) based on a given prefix (e.g. 'qc'; default to config file
   * specified prefix); Fields wished to be requested for each object can be passed through the fields parameter;
   * If missing, a default list will be used:
   * * default fields list returned: [name, created, lastModified]
   * * @example Equivalent of URL request: `/latest/qc/TPC/object.*`
   * @param {String} prefix - Prefix for which CCDB should search for objects
   * @param {Array<String>} fields - List of fields that should be requested for each object
   * @returns {Promise.<Array<Object>>} - results of objects query or error
   * @throws {Error}
   */
  async getObjectsLatestVersionList(prefix = this.PREFIX, fields = []) {
    try {
      const headers = {
        Accept: 'application/json',
        'X-Filter-Fields': fields.length >= 0 ? fields.join(',') : `${this.PATH},${this.CREATED},${this.LAST_MODIFIED}`,
      };

      const { objects } = await httpGetJson(this.hostname, this.port, `/latest/${prefix}.*`, headers);
      return objects
        .filter(QCObjectDto.isObjectPathValid)
        .map(QCObjectDto.toStandardObject);
    } catch (error) {
      errorLogger(error, 'ccdb');
      throw new Error(`Unable to retrieve list of latest versions of objects due to: ${error.message || error}`);
    }
  }

  /**
   * Retrieve a sorted list of available timestamps for a specified object; Number of timestamps defaults to 100
   * but it can be passed a different value
   * @example Equivalent of URL request: `/browse/qc/TPC/object/1`
   * @param {string} objectName - full path of the object
   * @param {number} limit - how many timestamps should retrieve
   * @param {String} filter - filter that should be applied when querying object; e.g. RunNumber=324543
   * @returns {Promise.<Array<Number>>} - results with list of timestamps
   * @throws {Error}
   */
  async getObjectTimestampList(objectName, limit = 1000, filter = '') {
    const headers = {
      Accept: 'application/json',
      'X-Filter-Fields': `${this.VALID_FROM}`,
      'Browse-Limit': `${limit}`,
    };
    try {
      const url = `/browse/${objectName}/${filter}`;
      const { objects } = await httpGetJson(this.hostname, this.port, url, headers);
      return objects.map((object) => parseInt(object[this.VALID_FROM], 10));
    } catch (error) {
      errorLogger(error, 'ccdb');
      throw new Error('Unable to retrieve latest timestamps list');
    }
  }

  /**
   * Return the validity of an object (looked by name, timestamp and filter) in the form of a timestamp;
   * @param {string} path - full path of the object to query; no regex allowed
   * @param {number} timestamp - timestamp in ms
   * @param {string} filter - filter to be applied to query object such as '?RunNumber=54323423'
   * @returns {Promise.<object>} - returns object validity
   * @throws {Error}
   */
  async getObjectValidity(path, timestamp = '', filter = '') {
    const headers = {
      Accept: 'application/json',
      'X-Filter-Fields': `${this.VALID_FROM}`,
    };
    let result = {};
    let url = `/latest/${path}`;
    if (timestamp) {
      url += `/${timestamp}`;
    }
    if (filter) {
      url += `/${filter}`;
    }

    try {
      result = await httpGetJson(this.hostname, this.port, url, headers);
    } catch (error) {
      // ErrorLogger(error, 'ccdb');
      throw new Error('Unable to retrieve object validity');
    }
    if (result && result.objects && result.objects.length > 0) {
      return result.objects[0][this.VALID_FROM];
    } else {
      throw new Error(`Object: ${url} could not be found`);
    }
  }

  /**
   * Make a HEAD HTTP call to CCDB to retrieve data of the QC object; Name and timestamp are mandatory in this case,
   * otherwise CCDB will return 404 while the filter string is optional;
   * This is needed in case object is stored on remote alien, case in which CCDB will make a local copy as soon as the
   * HEAD request is done;
   * @example Equivalent of URL request:
   * host:port/qc/CPV/MO/NoiseOnFLP/ClusterMapM2/1646925158138/RunNumber=34543543  -H 'Accept: application/json' --head
   * @param {string} name - full name(path) of the object in question
   * @param {number} timestamp - version of the object data
   * @param {string} filter - filter that should be applied when querying object; e.g. RunNumber=324543
   * @returns {Promise.<JSON>} e.g  {location: '/download/id', drawOptions: 'colz'}
   * @throws {Error}
   */
  async getObjectDetails(name, timestamp, filter = '') {
    if (!name || !timestamp) {
      throw new Error('Missing mandatory parameters: name & timestamp');
    }
    const path = `/${name}/${timestamp}/${filter}`;
    const reqHeaders = { Accept: 'application/json' };

    const { status, headers } = await httpHeadJson(this.hostname, this.port, path, reqHeaders);
    if (status >= 200 && status <= 299) {
      // eslint-disable-next-line prefer-destructuring
      const location = headers[this.CONTENT_LOCATION]
        .split(', ')
        .filter((location) => !location.startsWith('alien'))[0];
      if (!location) {
        throw new Error(`No location provided by CCDB for object with path: ${path}`);
      }
      const objectDetails = QCObjectDto.toStandardObject(headers);
      objectDetails.location = location;
      return objectDetails;
    } else {
      throw new Error(`Unable to retrieve object: ${name}`);
    }
  }

  /**
   * Get latest version of an object or a specified version through the timestamp;
   * @param {string} path - Complete name of object; e.g qc/MO/CPV/merger1
   * @param {number} timestamp - version of object that should be queried
   * @returns {Promise.<JSON>} - object details for a given timestamp
   * @throws {Error}
   */
  async getObjectLatestVersionInfo(path, timestamp = '') {
    if (!path) {
      throw new Error('Failed to load object due to missing path');
    }
    const timestampHeaders = {
      Accept: 'application/json', 'X-Filter-Fields': this._getHeadersForOneObject(), 'Browse-Limit': 1,
    };
    try {
      const { objects } = await httpGetJson(this.hostname, this.port, `/latest/${path}/${timestamp}`, timestampHeaders);
      if (objects?.length <= 0) {
        throw new Error(`No object found for: ${path}`);
      }
      if (QCObjectDto.isObjectPathValid(objects[0])) {
        return objects[0];
      } else {
        throw new Error(`Invalid object provided for: ${path}`);
      }
    } catch (error) {
      errorLogger(error);
      throw new Error(`Unable to retrieve object for: ${path}`);
    }
  }

  /*
   * Helpers
   */

  /**
   * Get prefix from configuration file and parse it or use as default empty prefix
   * @param {JSON} config - object as JSON with configuration
   * @returns {string} - format `name`
   */
  _getPrefix(config) {
    let { prefix = '' } = config;
    if (config?.prefix?.trim()) {
      prefix = prefix.substring(0, 1) === '/' ? prefix.substring(1, prefix.length) : prefix;
      prefix = prefix.substring(prefix.length - 1, prefix.length) === '/'
        ? prefix.substring(0, prefix.length - 1) : prefix;
    }
    return prefix;
  }

  /**
   * Returns list of headers as a string that are of interest when querying data about 1 object only
   * @returns {string} - headers list joined by ','
   */
  _getHeadersForOneObject() {
    return `${this.PATH},${this.LAST_MODIFIED},size,fileName,id,metadata`;
  }
}
