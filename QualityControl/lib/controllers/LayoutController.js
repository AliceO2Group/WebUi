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
import { LayoutDto } from './../dtos/LayoutDto.js';

/**
 * Gateway for all requests with regards to QCG Layouts
 */
export class LayoutController {
  /**
   * Setup Layout Controller:
   * - JSONFileConnector - recommended for local development
   * - SQLService - recommended for production [WIP]
   * @param {JSONFileConnector/SQLService} service - providing ways for retrieving/updating layouts information
   */
  constructor(service) {
    assert(service, 'Missing service for retrieving layout data');

    /**
     * @type {JSONFileConnector/SQLService}
     */
    this._service = service;
  }

  /**
   * Fetches and responds with all layouts:
   * * can be filtered by "owner_id"
   * * if no owner_id is provided, all layouts will be fetched;
   * @param {Request} req - HTTP request object with information on owner_id
   * @param {Response} res - HTTP response object to provide layouts information
   * @returns {undefined}
   */
  async listLayouts(req, res) {
    try {
      const filter = {};
      if (req.query.owner_id !== undefined) {
        filter.owner_id = parseInt(req.query.owner_id, 10);
      }
      const layouts = await this._service.listLayouts(filter);
      res.status(200).json(layouts);
    } catch (error) {
      errorHandler(error, 'Failed to retrieve layouts', res, 502, 'layout');
    }
  }

  /**
   * Fetches and responds with a single layout specified by layout "id" if found;
   * @param {Request} req - HTTP request object with "params" information on layout ID
   * @param {Response} res - HTTP response object to provide layout information
   * @returns {undefined}
   */
  async readLayout(req, res) {
    try {
      const layoutId = req.params.id;
      if (!layoutId) {
        errorHandler('Missing layoutId parameter', 'Missing layoutId parameter', res, 400, 'layout');
        return;
      }
      const layout = await this._service.readLayout(layoutId);
      res.status(200).json(layout);
    } catch (error) {
      errorHandler(error, 'Failed to retrieve layout', res, 502, 'layout');
    }
  }

  /**
   * Update a single layout specified by:
   * * query.layoutId for identification
   * * body - for layout data to be updated
   * @param {Request} req - HTTP request object with "query" and "body" information on layout
   * @param {Response} res - HTTP response object to provide information on the update
   * @returns {undefined}
   */
  async updateLayout(req, res) {
    try {
      const { layoutId } = req.query;
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

      const layout = await this._service.updateLayout(layoutId, data);
      res.status(201).json(layout);
    } catch (error) {
      errorHandler(error, 'Failed to update layout', res, 502, 'layout');
    }
  }

  /**
   * Attempts to delete a single layout specified by its id
   * @param {Request} req - HTTP request object with "params" information on layout ID
   * @param {Response} res - HTTP response object to inform client if deletion was successful
   * @returns {undefined}
   */
  async deleteLayout(req, res) {
    try {
      const layoutId = req.params.id;
      if (!layoutId) {
        const errMsg = 'Missing layoutId parameter';
        errorHandler(errMsg, errMsg, res, 400, 'layout');
        return;
      }

      const result = await this._service.deleteLayout(layoutId);
      res.status(200).json(result);
    } catch (error) {
      errorHandler(error, 'Failed to delete layout', res, 502, 'layout');
    }
  }

  /**
   * Validates received payload follows a layout format and if successful, stores it
   * @param {Request} req - HTTP request object with "body" information on layout to be created
   * @param {Response} res - HTTP request object with result of the action
   * @returns {undefined}
   */
  async createLayout(req, res) {
    try {
      const layout = await LayoutDto.validateAsync(req.body);
      const result = await this._service.createLayout(layout);
      res.status(201).json(result);
    } catch (error) {
      let message = 'Failed to create new layout';
      if (error?.name === 'ValidationError') { // JOI validation
        message = `Failed to validate layout: ${error?.details[0]?.message || ''}`;
      }
      errorHandler(error, message, res, 409, 'layout');
    }
  }
}
