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

const assert = require('assert');
const {errorHandler} = require('../utils.js');

/**
 * Gateway for all Layout requests
 */
class LayoutService {
  /**
   * Setup Layout Service:
   * - JSONFileConnector - recommended for local development
   * - SQLService - recommended for production [WIP]
   * @param {JSONFileConnector/SQLService} service
   */
  constructor(service) {
    assert(service, 'Missing service for retrieving layout data');
    this.service = service;
  }

  /**
   * List all layouts, can be filtered by owner_id
   * @param {Request} req
   * @param {Response} res
   * @return {Promise}
   */
  async listLayouts(req, res) {
    try {
      const filter = {};
      if (req.query.owner_id !== undefined) {
        filter.owner_id = parseInt(req.query.owner_id, 10);
      }
      const layouts = await this.service.listLayouts(filter);
      res.status(200).json(layouts);
    } catch (error) {
      errorHandler(error, 'Failed to retrieve layouts', res, 502, 'layout');
    }
  }

  /**
   * Read a single layout specified by layoutId
   * @param {Request} req
   * @param {Response} res
   * @return {Promise}
   */
  async readLayout(req, res) {
    try {
      const layoutId = req.params.id;
      if (!layoutId) {
        errorHandler('Missing layoutId parameter', 'Missing layoutId parameter', res, 400, 'layout');
        return;
      }
      const layout = await this.service.readLayout(layoutId)
      res.status(200).json(layout);
    } catch (error) {
      // TODO decide between 404 and 502 based on error response
      errorHandler(error, `Failed to retrieve layout`, res, 502, 'layout')
    }
  }

  /**
   * Update a single layout specified by layoutId and body
   * @param {Request} req
   * @param {Response} res
   * @return {Promise}
   */
  async updateLayout(req, res) {
    try {
      const layoutId = req.query.layoutId;
      const data = req.body;

      if (!layoutId) {
        const errMsg = 'Missing layoutId parameter';
        errorHandler(errMsg, errMsg, res, 400, 'layout');
        return;
      }

      if (!data) {
        const errMsg = 'Missing body content parameter';
        errorHandler(errMsg, errMsg, res, 400, 'layout');
        return;
      }

      const layout = await this.service.updateLayout(layoutId, data)
      res.status(201).json(layout);
    } catch (error) {
      errorHandler(error, `Failed to update layout`, res, 502, 'layout')
    }

  }

  /**
   * Request to delete a single layout specified by layoutId
   * @param {Request} req
   * @param {Response} res
   * @return {Promise}
   */
  async deleteLayout(req, res) {
    try {
      const layoutId = req.params.id;
      if (!layoutId) {
        const errMsg = 'Missing layoutId parameter';
        errorHandler(errMsg, errMsg, res, 400, 'layout');
        return;
      }

      const result = await this.service.deleteLayout(layoutId);
      res.status(200).json(result);
    } catch (error) {
      errorHandler(error, 'Failed to delete layout', res, 502, 'layout');
    }
  }

  /**
   * Create a layout specified by body
   * @param {Request} req
   * @param {Response} res
   * @return {Promise}
   */
  async createLayout(req, res) {
    try {

      const layout = req.body;

      if (!layout.name) {
        const errMsg = 'Missing layout.name parameter';
        errorHandler(errMsg, errMsg, res, 400, 'layout');
        return;
      }
      if (layout.owner_id === undefined) { // integer from 0 to Infinity
        const errMsg = 'Missing layout.owner_id parameter';
        errorHandler(errMsg, errMsg, res, 400, 'layout');
        return;
      }
      if (!layout.owner_name) {
        const errMsg = 'Missing layout.owner_name parameter';
        errorHandler(errMsg, errMsg, res, 400, 'layout');
        return;
      }
      if (!layout.tabs) {
        const errMsg = 'Missing layout.tabs parameter';
        errorHandler(errMsg, errMsg, res, 400, 'layout');
        return;
      }

      const result = await this.service.createLayout(layout)
      res.status(201).json(result);
    } catch (error) {
      errorHandler(error, 'Failed to create layout', res, 409, 'layout');
    }

  }
}

module.exports = LayoutService;
