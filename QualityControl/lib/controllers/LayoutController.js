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
import { LayoutDto, LayoutsGetDto } from './../dtos/LayoutDto.js';
import { LayoutPatchDto } from './../dtos/LayoutPatchDto.js';

import {
  InvalidInputError,
  LogManager,
  updateAndSendExpressResponseFromNativeError,
}
  from '@aliceo2/web-ui';
import { mapLayoutToAPI } from './helpers/mapLayoutToAPI.js';

/**
 * @typedef {import('../services/layout/LayoutService.js').LayoutService} LayoutService
 */

const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/layout-ctrl`);

/**
 * Gateway for all HTTP requests with regards to QCG Layouts
 */
export class LayoutController {
  /**
   * Setup Layout Controller:
   * @param {LayoutService} layoutService - The service for layout data
   */

  constructor(layoutService) {
    assert(layoutService, 'Missing layout service');

    /** @type {LayoutService} */
    this._layoutService = layoutService;
  }

  /**
   * HTTP GET endpoint for retrieving a list of layouts
   * * Can be filtered by "owner_id" or "objectPath" using filter.objectPath
   * * if no owner_id is provided, all layouts will be fetched;
   * @param {Request} req - HTTP request object with information on owner_id
   * @param {Response} res - HTTP response object to provide layouts information
   * @returns {undefined}
   */
  async getLayoutsHandler(req, res) {
    let fields = undefined;
    let owner_id = undefined;
    let filter = undefined;

    try {
      const validated = await LayoutsGetDto.validateAsync(req.query);
      ({ fields, owner_id, filter } = validated);
    } catch (error) {
      const responseError = error.isJoi ?
        new InvalidInputError(`Invalid query parameters: ${error.details[0].message}`) :
        new Error('Unable to process request');

      logger.errorMessage(`Error getting layouts: ${responseError.message}`);
      return updateAndSendExpressResponseFromNativeError(res, responseError);
    }

    try {
      const filters = owner_id !== undefined ? { owner_id, ...filter } : { ...filter };
      const layouts = await this._layoutService.getLayoutsByFilters(filters);
      const adaptedLayouts = layouts.map((layout) =>
        mapLayoutToAPI(layout, fields));
      return res.status(200).json(adaptedLayouts);
    } catch (error) {
      logger.errorMessage(`Error retrieving layouts: ${error}`);
      return updateAndSendExpressResponseFromNativeError(res, new Error('Unable to retrieve layouts'));
    }
  }

  /**
   * HTTP GET endpoint for retrieving a single layout specified by layout "id";
   * @param {Request} req - HTTP request object with "params" information on layout ID
   * @param {Response} res - HTTP response object to provide layout information
   * @returns {undefined}
   */
  async getLayoutHandler(req, res) {
    const { id } = req.params;
    try {
      const layout = await this._layoutService.getLayoutById(id);
      const adaptedLayout = mapLayoutToAPI(layout);
      res.status(200).json(adaptedLayout);
    } catch (error) {
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
      const adaptedLayout = mapLayoutToAPI(layout);
      res.status(200).json(adaptedLayout);
    } catch (error) {
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
    const { id } = req.params;
    let layoutProposed = req.body;
    const parsedId = parseInt(id, 10);
    try {
      if (Object.keys(layoutProposed).length === 0) {
        throw new InvalidInputError('No layout data provided in the request body');
      }
      if (parsedId !== layoutProposed.id) {
        throw new InvalidInputError('Layout ID in the path does not match ID in the body');
      }
      layoutProposed = await LayoutDto.validateAsync({ ...layoutProposed });
    } catch (error) {
      updateAndSendExpressResponseFromNativeError(
        res,
        error.isJoi ?
          new InvalidInputError(`Failed to validate layout: ${error?.details[0]?.message || ''}`) :
          error,
      );
      return;
    }
    try {
      const updatedLayoutId = await this._layoutService.putLayout(parsedId, layoutProposed);
      res.status(200).json({ id: updatedLayoutId });
    } catch (error) {
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
    const { id } = req.params;
    try {
      await this._layoutService.removeLayout(id);
      res.status(200).json({ id });
    } catch (error) {
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
    let layoutProposed = {};
    try {
      layoutProposed = await LayoutDto.validateAsync(req.body);
    } catch (error) {
      updateAndSendExpressResponseFromNativeError(
        res,
        new InvalidInputError(`Failed to validate layout: ${error?.details[0]?.message || ''}`),
      );
      return;
    }
    try {
      const newLayout = await this._layoutService.postLayout(layoutProposed);
      res.status(201).json({ id: newLayout.id });
    } catch (error) {
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
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    try {
      if (Object.keys(req.body).length === 0) {
        throw new InvalidInputError('No layout data provided in the request body');
      }
      // Validate the patch object
      const layout = await LayoutPatchDto.validateAsync(req.body);

      // Apply the patch
      const updatedLayoutId = await this._layoutService.patchLayout(parsedId, layout);
      res.status(200).json({ id: updatedLayoutId });
    } catch (error) {
      let responseError = error;
      if (error.isJoi) {
        responseError = new InvalidInputError(`Failed to validate layout patch: ${error?.details[0]?.message || ''}`);
      }
      updateAndSendExpressResponseFromNativeError(res, responseError);
      return;
    }
  }
}
