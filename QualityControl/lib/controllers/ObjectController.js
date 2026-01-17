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
import { InvalidInputError, LogManager, updateAndSendExpressResponseFromNativeError } from '@aliceo2/web-ui';
import { ObjectGetDownloadDTO } from '../dtos/ObjectGetDto.js';

const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/obj-controller`;

/**
 * Gateway for all QC Objects requests
 * @class
 */
export class ObjectController {
  /**
   * Setup Object Controller:
   * - CcdbService - retrieve data about objects
   * @import { QcdbDownloadService } from '../services/QcdbDownload.service.js';
   * @param {QCObjectService} objService - objService to be used for retrieval of information
   * @param {RunMonitoringService} runModeService - for monitoring the status of runs periodically
   * @param {QcdbDownloadService} qcdbDownloadService - service that will download from qcdb.
   */
  constructor(objService, runModeService, qcdbDownloadService) {
    /**
     * @type {QCObjectService}
     */
    this._objService = objService;

    /**
     * @type {QcdbDownloadService}
     * @import { QcdbDownloadService } from '../services/QcdbDownload.service.js';
     */
    this._qcdbDownloadService = qcdbDownloadService;

    /**
     * @type {RunMonitoringService}
     */
    this._runModeService = runModeService;
    this._logger = LogManager.getLogger(LOG_FACILITY);
  }

  /**
   * Retrieve a list of objects from CCDB with requested fields or default selection
   * @param {Request} req - HTTP request object with "query" information on object
   * @param {Response} res - HTTP response object to provide information on request
   * @returns {void}
   */
  async getObjectsHandler(req, res) {
    try {
      const { prefix, fields, filters = {}, inRunMode = false } = req.query;

      if (inRunMode) {
        const runNumber = filters?.RunNumber;
        const { paths } = await this._runModeService.retrievePathsAndSetRunStatus(runNumber);
        return res.status(200).json({ paths });
      }

      const objectsData = await this._objService.retrieveLatestVersionOfObjects({
        prefix,
        fields,
        filters,
      });
      res.status(200).json(objectsData);
    } catch (error) {
      const responseError = new Error('Failed to retrieve list of objects latest version');
      this._logger.errorMessage(`Error whilst retrieving objects: ${error}`);
      updateAndSendExpressResponseFromNativeError(res, responseError);
    }
  }

  /**
   * Download ROOT objects using the QcdbDownloadService.
   * Only support 1 root object for now.
   * @param {Request} req - ExpressJs req object.
   * @param {Response} res - ExpressJs res object.
   * @returns {void}
   */
  async getDownloadObjectsHandler(req, res) {
    let objectIds = undefined;
    try {
      const validated = await ObjectGetDownloadDTO.validateAsync(req.query);
      ({ objectIds } = validated);
      await this._qcdbDownloadService.getQcdbRootObjects(objectIds, res);
    } catch (error) {
      let responseError = '';
      if (error.isJoi) {
        this._logger.errorMessage(`Error validating query parameters: ${error}`);
        responseError = new InvalidInputError(`Invalid query parameters: ${error.details[0].message}`);
      } else {
        this._logger.errorMessage(error?.message ?? error);
        responseError = new Error('Unable to process request');
      }

      return updateAndSendExpressResponseFromNativeError(res, responseError);
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
   * @returns {Promise<void>}
   */
  async getObjectContentHandler(req, res) {
    try {
      const { path, validFrom, filters, id } = req.query;

      const object = await this._objService.retrieveQcObject({ path, validFrom, id, filters });

      res.status(200).json(object);
    } catch (error) {
      this._logger.errorMessage(`Error whilst retrieving object content: ${error}`);
      updateAndSendExpressResponseFromNativeError(res, error);
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
   * @returns {Promise<void>}
   */
  async getObjectByIdHandler(req, res) {
    try {
      const qcObjectId = req.params.id;
      const { validFrom, filters, id } = req.query;

      const object = await this._objService.retrieveQcObjectByQcgId({ qcObjectId, id, validFrom, filters });
      res.status(200).json(object);
    } catch (error) {
      this._logger.errorMessage(`Error whilst retrieving object: ${error}`);
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }
}
