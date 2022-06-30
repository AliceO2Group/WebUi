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
import assert from 'assert';
import { errorHandler } from './../utils/utils.js';

/**
 * Gateway for all QC Objects requests
 */
export class ObjectController {
  /**
   * Setup Object Controller:
   * - CcdbService - retrieve data about objects
   * @param {CcdbServices} db - CCDB service to retrieve
   * @param {JsrootService} jsroot - service which provides jsroot functionality (`openFile`, `toJSON`)
   */
  constructor(db, jsroot) {
    assert(db, 'Missing service for retrieving objects data');
    this.db = db;
    this.jsroot = jsroot;
    this.DB_URL = `${this.db.protocol}://${this.db.hostname}:${this.db.port}/`;
  }

  /**
   * Build Object Data response based on passed object path
   * @param {Req} req - must contain object path
   * @param {Res} res
   */
  async getObjectInfo(req, res) {
    const path = req.query?.path;
    const timestamp = req.query?.timestamp;
    try {
      const info = await this.db.getObjectLatestVersionInfo(path, timestamp);

      res.status(200).json({ info });
    } catch (error) {
      errorHandler(error, 'Failed to load data for object', res, 502, 'object');
    }
  }

  /**
   * Using `browse` option, request a list of `last-modified` and `valid-from` for a specified path for an object
   * Use the first `validFrom` option to make a head request to CCDB; Request which will in turn return object information and download it locally on CCDB if it is not already done so
   * From the information retrieved above, use the location with JSROOT to get a JSON object
   * Use JSROOT to decompress a ROOT object content and convert it to JSON to be sent back to the client for interpretation with JSROOT.draw
   * @param {Request} req
   * @param {Response} res
   */
  async getObjectContent(req, res) {
    const path = req.query?.path;
    const timestamp = req.query?.timestamp;
    const filter = req.query?.filter;
    try {
      const validFrom = await this.db.getObjectValidity(path, timestamp, filter);
      const objDetails = await this.db.getObjectDetails(path, validFrom, filter);

      const url = this.DB_URL + objDetails.location;
      const root = await this._getJsRootFormat(url);
      objDetails.root = root;

      const timestamps = await this.db.getObjectTimestampList(path, 1000, filter);
      objDetails.timestamps = timestamps;
      res.status(200).json(objDetails);
    } catch (error) {
      errorHandler(error, 'Unable to identify object or read it', res, 502, 'object');
    }
  }

  /**
   * Retrieves a root object from url-location provided
   * Parses the objects and prepares it in QCG format
   * @param {String} url - location of Root file to be retrieved
   * @return {Promise<JSON.Error>}
   */
  async _getJsRootFormat(url) {
    const file = await this.jsroot.openFile(url);
    const root = await file.readObject('ccdb_object');
    root['_typename'] = root['mTreatMeAs'] || root['_typename'];
    const rootJson = await this.jsroot.toJSON(root);
    return rootJson;
  }
}
