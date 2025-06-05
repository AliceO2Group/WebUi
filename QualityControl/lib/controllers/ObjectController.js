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
import { InvalidInputError, NotFoundError, updateAndSendExpressResponseFromNativeError } from '@aliceo2/web-ui';
import { LogManager } from '@aliceo2/web-ui';

/**
 * Gateway for all QC Objects requests
 * @class
 */
export class ObjectController {
  /**
   * Setup Object Controller:
   * - CcdbService - retrieve data about objects
   * @param {QCObjectService} objService - objService to be used for retrieval of information
   */
  constructor(objService) {
    /**
     * @type {QCObjectService}
     */
    this._objService = objService;
    this._logger = LogManager.getLogger('object/controller');
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
      updateAndSendExpressResponseFromNativeError(
        res,
        new InvalidInputError('Invalid parameters provided: prefix must be of type string'),
      );
      return;
    } else if (!Array.isArray(fields)) {
      updateAndSendExpressResponseFromNativeError(
        res,
        new InvalidInputError('Invalid parameters provided: fields must be of type Array'),
      );
      return;
    } else {
      try {
        const list = await this._objService.retrieveLatestVersionOfObjects(prefix, fields);
        res.status(200).json(list);
      } catch (error) {
        updateAndSendExpressResponseFromNativeError(
          res,
          new Error('Failed to retrieve list of objects latest version'),
        );
        this._logger.errorMessage(error);
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
  async getObjectContent(req, res) {
    const { path, validFrom, id } = req.query;
    let { filters } = req.query;
    if (filters) {
      filters = this._parseAndCleanFilters(filters);;
    }
    if (!path) {
      updateAndSendExpressResponseFromNativeError(
        res,
        new InvalidInputError('Invalid URL parameters: missing object path'),
      );
    } else {
      try {
        const object = await this._objService.retrieveQcObject(path, Number(validFrom), id, filters);
        res.status(200).json(object);
      } catch (error) {
        updateAndSendExpressResponseFromNativeError(
          res,
          new Error('Unable to identify object or read it'),
        );
        this._logger.errorMessage(error);
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
    const { validFrom, id } = req.query;
    let { filters } = req.query;
    if (filters) {
      filters = this._parseAndCleanFilters(filters);;
    }
    if (!qcgId) {
      updateAndSendExpressResponseFromNativeError(
        res,
        new InvalidInputError('Invalid URL parameters: missing object ID'),
      );
      return;
    } else {
      try {
        const object = await this._objService.retrieveQcObjectByQcgId(qcgId, id, validFrom, filters);
        res.status(200).json(object);
      } catch (error) {
        updateAndSendExpressResponseFromNativeError(
          res,
          new NotFoundError('Unable to identify object or read it by qcg id'),
        );
        this._logger.errorMessage(error);
      }
    }
  }

  /**
   * Parses a JSON string or object representing filters and removes any entries with empty, null, or undefined values.
   * @param {string | object} filters - The filters to parse and clean. Can be a JSON string or an object.
   * @returns {object | undefined} A cleaned object with only valid filter entries, or undefined if parsing fails.
   */
  _parseAndCleanFilters(filters) {
    try {
      const parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
      const filteredEntries = Object
        .entries(parsedFilters)
        .filter(([_, value]) => value !== '' && value !== null && value !== undefined);
      return Object.fromEntries(filteredEntries);
    } catch {
      return {};
    }
  }
}
