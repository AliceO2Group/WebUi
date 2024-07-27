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
import { httpHeadJson, httpGetJson } from '../../utils/utils.js';
import {
  CCDB_MONITOR, CCDB_VERSION_KEY, CCDB_RESPONSE_BODY_KEYS, CCDB_FILTER_FIELDS, CCDB_RESPONSE_HEADER_KEYS,
} from './CcdbConstants.js';

const {
  LAST_MODIFIED, VALID_FROM, VALID_UNTIL, CREATED, PATH, SIZE, FILE_NAME, METADATA, ID,
} = CCDB_FILTER_FIELDS;

/**
 * Service customized for usage of QCDB - Quality Control Data Base & CCDB - Calibration and Conditions Database
 *
 * Database is set to work based on validity intervals, allowing querying objects by their:
 * - path or regex-path - allowing users to query all versions via `browse` option or `latest` version of the object
 * - path/[validFrom] - retrieve versions valid from a given timestamp
 * - path/[validFrom]/[validUntil] - retrieve versions for a given validity interval
 * - path/[validFrom]/[id] - retrieve a specif object by its ID and valid from timestamp
 *
 * The service also accepts filtering parameters such as Metadata fields. For QCDB some of them are:
 * - PassName, RunNumber, PartName, etc.
 * @class
 */
export class CcdbService {
  /**
   * Setup CCDB Service based on given configuration or using default values if configuration options are missing
   * @param {object} config - {hostname, port, protocol, cachePrefix, cacheRefreshRate, prefix}
   */
  constructor(config = {}) {
    this._hostname = config.hostname ?? 'localhost';
    this._port = config.port ?? 8080;
    this._protocol = config.protocol ?? 'http';
    this._CACHE_PREFIX = this._parsePrefix(config.cachePrefix ?? 'qc');
    this._CACHE_REFRESH_RATE = config.cacheRefreshRate ?? 2 * 60 * 1000;
    this._PREFIX = this._parsePrefix(config.prefix ?? 'qc');
  }

  /**
   * Given an object configuration, attempt to create, configure and return a CCDB service instance
   * @param {object} [config = {hostname, port}] - configuration with needed parameters for per the constructor
   * @returns {CcdbService} - an instance of the newly created service
   */
  static setup(config = {}) {
    const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/ccdb-setup`);

    const { hostname, port } = config;
    if (!hostname || !port) {
      logger.warnMessage(
        'Missing or incomplete configuration for CCDB. Will proceed with using default values',
        { level: 11, system: 'GUI', facility: 'qcg/ccdb-setup' },
      );
    }
    return new CcdbService(config);
  }

  /**
   * Check connection to CCDB service is up and running by requesting its version from healthcheck point.
   * Format of the response is as follows:
   * {
   *   ${CCDB_MONITOR}: {
   *     <hostname>: [
   *       { param: 'ccdb_version', updated: 1690295929225, value: '1.0.27' }
   *     ]
   *    }
   * }
   * @returns {Promise.<object>} - promise with results of the query to ccdb
   * @throws {Error}
   */
  async getVersion() {
    let serviceInfo = {};
    try {
      const path = `/monitor/${CCDB_MONITOR}/.*/${CCDB_VERSION_KEY}`;
      serviceInfo = await httpGetJson(this._hostname, this._port, path, { Accept: 'application/json' });
    } catch (error) {
      throw new Error(`Unable to connect to CCDB due to: ${error}`);
    }
    try {
      const version = Object.values(serviceInfo[CCDB_MONITOR])[0][0]?.value ?? '-';
      return { version };
    } catch (error) {
      throw new Error(`Unable to read version of CCDB due to: ${error}`);
    }
  }

  /**
   * Returns a list of objects path (corresponding to their latest version) based on a given prefix
   * (e.g. 'qc'; default to config file specified prefix);
   *
   * Due to CCDB returning sub-folders if regex is missing, service will add by default `.*` at the end to retrieve
   * paths starting with client provided prefix.
   *
   * Attributes of objects wished to be requested for each object can be passed through the fields parameter;
   * If attributes list is missing, a default minimal list will be used: PATH, CREATED, LAST_MODIFIED
   * @example Equivalent of URL request: `/latest/qc/TPC/object.*`
   * @param {string} [prefix] - Prefix for which CCDB should search for objects
   * @param {Array<string>} [fields] - List of fields that should be requested for each object
   * @returns {Promise.<Array<{PATH, CREATED, LAST_MODIFIED}>>} - results of objects query or error
   * @rejects {Error}
   */
  async getObjectsLatestVersionList(prefix = this._PREFIX, fields = []) {
    const headers = {
      accept: 'application/json',
      'x-filter-fields': fields.length > 0 ? fields.join(',') : `${PATH},${CREATED},${LAST_MODIFIED}`,
    };
    const { objects } = await httpGetJson(this._hostname, this._port, `/latest/${prefix}.*`, headers);
    return objects;
  }

  /**
   * Retrieve a sorted list of identifications for a specified object which represent different versions of the object;
   * Number of versions defaults to a limit but it can be changed by passing a value
   * @example Equivalent of URL request: `/browse/qc/TPC/object/14324234234234234/id-id-id-id-id/RunNumber=554345`
   * @param {CcdbObjectIdentification} [identification = {}] - properties of an object
   * @param {number} [limit] - how many versions should retrieve
   * @returns {Promise.<Array<{validFrom, id}>>} - results with identifications objects {validFrom, id}
   * @rejects {Error}
   */
  async getObjectVersions(identification, limit = 1000) {
    const headers = {
      Accept: 'application/json',
      'X-Filter-Fields': `${VALID_FROM},${ID},${CREATED}`,
      'Browse-Limit': `${limit}`,
    };
    const path = `/browse${this._buildCcdbUrlPath(identification)}`;
    const { objects } = await httpGetJson(this._hostname, this._port, path, headers);
    return objects.map((object) => (
      {
        [VALID_FROM]: parseInt(object[VALID_FROM], 10),
        [CREATED]: parseInt(object[CREATED], 10),
        [ID]: object[ID],
      }));
  }

  /**
   * Given a partial identification of an object, return the latest version identification of it;
   * @example
   * ```
   * {path: 'qc/TPC/object'}
   * {path: 'qc/TPC/object', validFrom: 123456543}
   * ```
   * @param {CcdbObjectIdentification} partialIdentification - fields such as path, validFrom, etc.
   * @returns {Promise.<CcdbObjectIdentification>} - returns object full identification
   * @throws {Error}
   */
  async getObjectIdentification(partialIdentification) {
    const headers = {
      Accept: 'application/json',
      'X-Filter-Fields': `${PATH},${ID},${VALID_FROM},${VALID_UNTIL}`,
    };
    const url = `/latest${this._buildCcdbUrlPath(partialIdentification)}`;

    const result = await httpGetJson(this._hostname, this._port, url, headers);
    if (result?.objects?.length > 0) {
      const [qcObject] = result.objects;
      return {
        [CCDB_RESPONSE_BODY_KEYS.PATH]: qcObject[CCDB_RESPONSE_BODY_KEYS.PATH],
        [CCDB_RESPONSE_BODY_KEYS.VALID_FROM]: qcObject[CCDB_RESPONSE_BODY_KEYS.VALID_FROM],
        [CCDB_RESPONSE_BODY_KEYS.VALID_UNTIL]: qcObject[CCDB_RESPONSE_BODY_KEYS.VALID_UNTIL],
        [CCDB_RESPONSE_BODY_KEYS.ID]: qcObject[CCDB_RESPONSE_BODY_KEYS.ID],
      };
    } else {
      throw new Error(`Object: ${url} could not be found`);
    }
  }

  /**
   * Make a HEAD HTTP call to CCDB to retrieve data of a specific QC object;
   * * path, validFrom and id are mandatory in this case, otherwise CCDB will return 404
   * * validUntil and filter map are optional;
   *
   * This request needs to be done to ask CCDB to download the object in-memory in case it is on remote alien or file.
   * CCDB will respond to the HEAD request as soon as the object has been successfully downloaded.
   *
   * As this is a heavy resource request, 3 parameters are mandatory: path, validFrom, id
   * @example Equivalent of URL request:
   * `/qc/CPV/MO/NoiseOnFLP/ClusterMapM2/1646925158138/RunNumber=34543543  -H 'Accept: application/json' --head`
   * @param {CcdbObjectIdentification} identification - attributes to identify the object specific version
   * @returns {Promise.<JSON>} e.g  {location: '/download/id', drawOptions: 'colz'}
   * @throws {Error}
   */
  async getObjectDetails(identification) {
    const { path = '', validFrom = undefined } = identification ?? {};
    if (!path || !validFrom) {
      throw new Error('Missing mandatory parameters: path & validFrom');
    }
    const url = this._buildCcdbUrlPath(identification);
    const { status, headers } = await httpHeadJson(this._hostname, this._port, url, { Accept: 'application/json' });
    if (status >= 200 && status <= 399) {
      const [location = ''] = headers[CCDB_RESPONSE_HEADER_KEYS.CONTENT_LOCATION]
        .split(', ')
        .filter((location) => !location.startsWith('alien') && !location.startsWith('file'));
      if (!location) {
        throw new Error(`No location provided by CCDB for object with path: ${path}`);
      }
      headers.location = location;
      return headers;
    } else {
      throw new Error(`Unable to retrieve object: ${path} due to status: ${status}`);
    }
  }

  /**
   * Make a GET request to CCDB to retrieve the latest version of an object based on given identification
   * The minimum required parameter to provide is the `path`
   * @param {CcdbObjectIdentification} identification - attributes by which the object should be queried
   * @returns {Promise.<JSON>} - object details for a given timestamp
   * @throws {Error}
   */
  async getObjectLatestVersionInfo(identification) {
    const { path } = identification ?? {};
    if (!path) {
      throw new Error('Missing mandatory parameter: path');
    }
    const timestampHeaders = {
      Accept: 'application/json', 'X-Filter-Fields': this._getHeadersForOneObject(), 'Browse-Limit': 1,
    };
    try {
      const url = `/latest${this._buildCcdbUrlPath(identification)}`;
      const { objects } = await httpGetJson(this._hostname, this._port, url, timestampHeaders);
      if (objects?.length <= 0) {
        throw new Error(`No object found for: ${path}`);
      }
      return objects[0];
    } catch {
      throw new Error(`Unable to retrieve object for: ${path}`);
    }
  }

  /**
   * Return the string that should be used as a prefix for caching objects
   * @returns {string} - prefix to be used for caching
   */
  get CACHE_PREFIX() {
    return this._CACHE_PREFIX;
  }

  /**
   * Return the number of ms for the interval for refreshing the cache
   * @returns {number} - number of ms
   */
  get CACHE_REFRESH_RATE() {
    return this._CACHE_REFRESH_RATE;
  }

  /**
   * Return the prefix that is to be used for retrieving objects list if client does not provide one
   * @example `qc`
   * @returns {string} - default prefix to be used for quering objects
   */
  get PREFIX() {
    return this._PREFIX;
  }

  /*
   * Helpers
   */

  /**
   * Given a string to be used as prefix for data service, parse it so that it is not prefixed or suffixed with '/'
   * @param {string} prefix - prefix to be parsed
   * @returns {string} - format `qc/detector/object`
   */
  _parsePrefix(prefix = '') {
    if (prefix.trim()) {
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
    return `${PATH},${LAST_MODIFIED},${SIZE},${FILE_NAME},${ID},${METADATA}`;
  }

  /**
   * Build the API path for retrieving an object from CCDB based on its components
   * /<path>/[validFrom]/[validUntil]/[id]/[filters]
   * @example `qc/TPC/object/12312341231/32132131231/test-id-2/RunNumber=1234533
   * @param {CcdbObjectIdentification} identification - object with QcObject identification attributes
   * @returns {string} - url component for CCDB request
   */
  _buildCcdbUrlPath(identification) {
    const { path, validFrom = undefined, validUntil = undefined, id = '', filters = {} } = identification;
    let url = `/${path}`;
    if (Number.isInteger(Number(validFrom))) {
      url += `/${validFrom}`;
    }
    if (Number.isInteger(Number(validUntil))) {
      url += `/${validUntil}`;
    }
    if (id && id.trim() !== '') {
      url += `/${id}`;
    }
    if (filters && Object.keys(filters).length > 0) {
      url += `/${Object.entries(filters)
        .flatMap(([key, value]) => `${key}=${value}`)
        .join('/')}`;
    }
    return url;
  }
}
