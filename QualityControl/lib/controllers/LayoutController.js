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

import {
  InvalidInputError,
  LogManager,
  updateAndSendExpressResponseFromNativeError,
}
  from '@aliceo2/web-ui';
import { LayoutAdapter } from './adapters/layout-adapter.js';

/**
 * @typedef {import('../services/layout/LayoutService.js').LayoutService} LayoutService
 */

const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/layout-ctrl`;

/**
 * Gateway for all HTTP requests with regards to QCG Layouts
 */
export class LayoutController {
  /**
   * Setup Layout Controller:
   * @param {LayoutService} layoutService - The repository for layout data
   */

  constructor(layoutService) {
    assert(layoutService, 'Missing layout service');

    /**
     * @type {LayoutService}
     */
    this._layoutService = layoutService;

    this._logger = LogManager.getLogger(LOG_FACILITY);
  }

  /**
   * HTTP GET endpoint for retrieving a list of layouts
   * @param {Request} req - HTTP request object with information on owner_id
   * @param {string} [req.query.owner_id] - Optional owner_id to filter layouts by
   * @param {string} [req.query.filter] - Optional filter object as JSON string
   * @param {string} [req.query.fields] - Optional comma-separated list of fields to include in the response
   * @param {Response} res - HTTP response object to provide layouts information
   * @returns {undefined}
   */
  async getLayoutsHandler(req, res) {
    const { owner_id, filter, fields } = req.query;
    try {
      const layouts =
        await this._layoutService.getLayoutsByFilters({ ...filter, owner_id });
      const adaptedLayouts = layouts.map((layout) => LayoutAdapter.adaptLayoutForExpressAPI(layout, fields));
      res.status(200).json(adaptedLayouts);
      return;
    } catch (error) {
      this._logger.errorMessage(`Error retrieving layouts: ${error.message || error}`);
      updateAndSendExpressResponseFromNativeError(res, error);
      return;
    }
  }

  /**
   * HTTP GET endpoint for retrieving a single layout specified by layout "id";
   * @param {Request} req - HTTP request object with "params" information on layout ID
   * @param {Response} res - HTTP response object to provide layout information
   * @returns {undefined}
   */
  async getLayoutHandler(req, res) {
    try {
      const adaptedLayout = LayoutAdapter.adaptLayoutForExpressAPI(req.layout);
      res.status(200).json(adaptedLayout);
    } catch (error) {
      this._logger.errorMessage(`Error retrieving layout by ID: ${error.message || error}`);
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }

  /**
   * HTTP GET endpoint for retrieving a single layout via query parameters. Either by:
   * * name (e.g. CALIBRATIONS)
   * * runDefinition + pdpBeamMode
   * @param {Request} req - HTTP request object with "params" information on layout ID
   * @param {Response} res - HTTP response object to provide layout information
   * @returns {undefined}
   */
  async getLayoutByNameHandler(req, res) {
    const { name, runDefinition, pdpBeamType } = req.query;
    let layoutName = '';
    if (name) {
      layoutName = name;
    } else if (runDefinition && pdpBeamType) {
      layoutName = `${runDefinition}_${pdpBeamType}`;
    } else if (runDefinition) {
      layoutName = runDefinition;
    } else {
      updateAndSendExpressResponseFromNativeError(res, new InvalidInputError('Missing query parameters'));
      return;
    }
    try {
      const layout = await this._layoutService.getLayoutByName(layoutName);
      const adaptedLayout = LayoutAdapter.adaptLayoutForExpressAPI(layout);
      res.status(200).json(adaptedLayout);
    } catch (error) {
      this._logger.errorMessage(`Error retrieving layout by name: ${error.message || error}`);
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }

  /**
   * HTTP PUT endpoint for updating a single layout specified by:
   * * query.id for identification
   * * body - for layout data to be updated
   * @param {Request} req - HTTP request object with "query" and "body" information on layout
   * @param {Response} res - HTTP response object to provide information on the update
   * @returns {undefined}
   */
  async putLayoutHandler(req, res) {
    try {
      const updatedLayoutId = await this._layoutService.putLayout(req.params.id, req.body);
      res.status(200).json({ id: updatedLayoutId });
    } catch (error) {
      this._logger.errorMessage(`Error updating layout: ${error.message || error}`);
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }

  /**
   * HTTP DELETE endpoint to allow removal a single layout specified by its id
   * @param {Request} req - HTTP request object with "params" information on layout ID
   * @param {Response} res - HTTP response object to inform client if deletion was successful
   * @returns {undefined}
   */
  async deleteLayoutHandler(req, res) {
    try {
      const result = await this._layoutService.removeLayout(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      this._logger.errorMessage(`Error updating layout: ${error.message || error}`);
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }

  /**
   * HTTP POST endpoint that validates received payload follows a layout format and if successful, stores it
   * @param {Request} req - HTTP request object with "body" information on layout to be created
   * @param {Response} res - HTTP request object with result of the action
   * @returns {undefined}
   */
  async postLayoutHandler(req, res) {
    const layoutProposed = req.body;
    try {
      const result = await this._layoutService.postLayout(layoutProposed);
      res.status(201).json(result);
    } catch (error) {
      this._logger.errorMessage(`Error creating layout: ${error.message || error}`);
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }

  /**
   * Patch a layout entity with information as per LayoutPatchDto.js
   * @param {Request} req - HTTP request object with "params" and "body" information on layout
   * @param {Response} res - HTTP response object to provide information on the update
   * @returns {undefined}
   */
  async patchLayoutHandler(req, res) {
    try {
      const patchedLayoutId = await this._layoutService.patchLayout(req.params.id, req.body);
      res.status(200).json({ id: patchedLayoutId });
    } catch (error) {
      this._logger.errorMessage(`Error patching layout: ${error.message || error}`);
      updateAndSendExpressResponseFromNativeError(res, error);
      return;
    }
  }
}
