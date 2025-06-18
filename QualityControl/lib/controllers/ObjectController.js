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
import { LogManager, updateAndSendExpressResponseFromNativeError } from '@aliceo2/web-ui';

const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/object-ctrl`);

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
  }

  /**
   * Retrieve a list of objects from CCDB with requested fields or default selection
   * @param {Request} req - HTTP request object with "query" information on object
   * @param {Response} res - HTTP response object to provide information on request
   * @returns {void}
   */
  async getObjects(req, res) {
    try {
      const { prefix, fields, filters } = req.query;

      const list = await this._objService.retrieveLatestVersionOfObjects({ prefix, fields, filters });
      res.status(200).json(list);
    } catch (error) {
      const responseError = new Error('Failed to retrieve list of objects latest version');

      logger.errorMessage(`Error validating query parameters: ${error}`);
      updateAndSendExpressResponseFromNativeError(res, responseError);
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
    try {
      const { path, validFrom, filters, id } = req.query;

      const object = await this._objService.retrieveQcObject(path, validFrom, id, filters);
      res.status(200).json(object);
    } catch (error) {
      const responseError = new Error('Failed to retrieve object content');

      logger.errorMessage(`Error validating query parameters: ${error}`);
      updateAndSendExpressResponseFromNativeError(res, responseError);
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
    try {
      const qcgId = req.params?.id;
      const { validFrom, filters, id } = req.query;

      const object = await this._objService.retrieveQcObjectByQcgId(qcgId, id, validFrom, filters);
      res.status(200).json(object);
    } catch (error) {
      const responseError = new Error('Unable to identify object or read it by qcg id');

      logger.errorMessage(`Error validating query parameters: ${error}`);
      updateAndSendExpressResponseFromNativeError(res, responseError);
    }
  }
}
