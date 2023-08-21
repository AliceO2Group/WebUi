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
'use strict';
import { getObjectsNameFromConsulMap } from '../../common/library/qcObject/utils.js';
import { errorHandler } from './../utils/utils.js';

/**
 * Gateway for all QC Objects requests
 * @class
 */
export class ObjectController {
  /**
   * Setup Object Controller:
   * - CcdbService - retrieve data about objects
   * @constructor
   * @param {QCObjectService} objService - objService to be used for retrieval of information
   * @param {ConsulService} onlineService - retrieve information on which objects are currently generated
   */
  constructor(objService, onlineService) {
    /**
     * @type {QCObjectService}
     */
    this._objService = objService;

    /**
     * @type {ConsulService}
     */
    this._onlineService = onlineService;
  }

  /**
   * Retrieve a list of objects from CCDB with requested fields or default selection
   * @param {Request} req - HTTP request object with "query" information on object
   * @param {Response} res - HTTP response object to provide information on request
   * @returns {void}
   */
  async getObjects(req, res) {
    const { prefix, fields = [] } = req.query;
    if (prefix && typeof prefix !== 'string') {
      res.status(400).json({ message: 'Invalid parameters provided: prefix must be of type string' });
    } else if (!Array.isArray(fields)) {
      res.status(400).json({ message: 'Invalid parameters provided: fields must be of type Array' });
    } else {
      try {
        const list = await this._objService.retrieveLatestVersionOfObjects(prefix, fields);
        res.status(200).json(list);
      } catch (error) {
        errorHandler(error, 'Failed to retrieve list of objects latest version', res, 502, 'object');
      }
    }
  }

  /**
   * List all Online objects' name if online mode is enabled
   * @param {Request} req - HTTP request object with "query" information on object
   * @param {Response} res - HTTP response object to provide information on request
   * @returns {void}
   */
  async getOnlineObjects(req, res) {
    try {
      const services = await this._onlineService.getServices();
      const tags = getObjectsNameFromConsulMap(this._db.prefix, services);
      res.status(200).json(tags);
    } catch (error) {
      errorHandler(error, 'Unable to retrieve list of Online Objects', res, 503, 'online');
    }
  }

  /**
   * Check the state of OnlineMode by checking the status of Consul Leading Agent
   * @param {Request} req - HTTP request object with information on owner_id
   * @param {Response} res - HTTP response object to provide layouts information
   * @returns {undefined}
   */
  async isOnlineModeConnectionAlive(req, res) {
    try {
      await this._onlineService.getConsulLeaderStatus();
      res.status(200).json({ running: true });
    } catch (error) {
      const message = 'Unable to retrieve Consul Status';
      errorHandler(error, message, res, 503, 'consul');
    }
  }

  /**
   * Using `browse` option, request a list of `last-modified` and `valid-from` for a specified path for an object
   * Use the first `validFrom` option to make a head request to CCDB; Request which will in turn return object
   * information and download it locally on CCDB if it is not already done so;
   * From the information retrieved above, use the location with JSROOT to get a JSON object
   * Use JSROOT to decompress a ROOT object content and convert it to JSON to be sent back to the client for
   * interpretation with JSROOT.draw
   * @param {Request} req - HTTP request object with "query" information
   * @param {Response} res - HTTP response object to provide information on request
   * @returns {void}
   */
  async getObjectContent(req, res) {
    const { path, validFrom, id, filters } = req.query;
    if (!path) {
      res.status(400).json({ message: 'Invalid URL parameters: missing object path' });
    } else {
      try {
        const object = await this._objService.retrieveQcObject(path, Number(validFrom), id, filters);
        res.status(200).json(object);
      } catch (error) {
        errorHandler(error, 'Unable to identify object or read it', res, 502, 'object');
      }
    }
  }

  /**
   * Using `browse` option, request a list of `last-modified` and `valid-from` for a specified path for an object
   * Use the first `validFrom` option to make a head request to CCDB; Request which will in turn return object
   * information and download it locally on CCDB if it is not already done so;
   * From the information retrieved above, use the location with JSROOT to get a JSON object
   * Use JSROOT to decompress a ROOT object content and convert it to JSON to be sent back to the client for
   * interpretation with JSROOT.draw
   * @param {Request} req - HTTP request object with "query" information
   * @param {Response} res - HTTP response object to provide information on request
   * @returns {void}
   */
  async getObjectById(req, res) {
    const qcgId = req.params?.id;
    const { validFrom, filters, id } = req.query;
    if (!qcgId) {
      res.status(400).json({ message: 'Invalid URL parameters: missing object ID' });
    } else {
      try {
        const object = await this._objService.retrieveQcObjectByQcgId(qcgId, id, validFrom, filters);
        res.status(200).json(object);
      } catch (error) {
        errorHandler(error, 'Unable to identify object or read it by qcg id', res, 502, 'object');
      }
    }
  }
}
