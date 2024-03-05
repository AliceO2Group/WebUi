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
import { LayoutDto } from './../dtos/LayoutDto.js';
import { LayoutPatchDto } from './../dtos/LayoutPatchDto.js';
import {
  updateExpressResponseFromNativeError,
} from './../errors/updateExpressResponseFromNativeError.js';
import { InvalidInputError } from './../errors/InvalidInputError.js';
import { UnauthorizedAccessError } from '../errors/UnauthorizedAccessError.js';

/**
 * Gateway for all HTTP requests with regards to QCG Layouts
 */
export class LayoutController {
  /**
   * Setup Layout Controller:
   * - JSONFileConnector - recommended for local development
   * @param {JSONFileConnector} dataService - providing ways for retrieving/updating layouts information
   */
  constructor(dataService) {
    assert(dataService, 'Missing service for retrieving layout data');

    /**
     * @type {JSONFileConnector}
     */
    this._dataService = dataService;
  }

  /**
   * HTTP GET endpoint for retrieving a list of layouts
   * * can be filtered by "owner_id"
   * * if no owner_id is provided, all layouts will be fetched;
   * @param {Request} req - HTTP request object with information on owner_id
   * @param {Response} res - HTTP response object to provide layouts information
   * @returns {undefined}
   */
  async getLayoutsHandler(req, res) {
    try {
      const filter = {};
      if (req.query.owner_id !== undefined) {
        filter.owner_id = parseInt(req.query.owner_id, 10);
      }
      const layouts = await this._dataService.listLayouts(filter);
      res.status(200).json(layouts);
    } catch (error) {
      updateExpressResponseFromNativeError(res, new Error('Unable to retrieve layouts'));
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
      if (!id) {
        updateExpressResponseFromNativeError(res, new InvalidInputError('Missing parameter "id" of layout'));
      } else {
        const layout = await this._dataService.readLayout(id);
        res.status(200).json(layout);
      }
    } catch (error) {
      updateExpressResponseFromNativeError(res, new Error(`Unable to retrieve layout with id: ${id}`));
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
    try {
      if (!id) {
        updateExpressResponseFromNativeError(res, new InvalidInputError('Missing parameter "id" of layout'));
      } else if (!req.body) {
        updateExpressResponseFromNativeError(res, new InvalidInputError('Missing body content to update layout with'));
      } else {
        const { personid } = req.session;
        const { owner_id } = await this._dataService.readLayout(id);

        if (owner_id !== personid) {
          updateExpressResponseFromNativeError(
            res,
            new UnauthorizedAccessError('Only the owner of the layout can update it'),
          );
        } else {
          const data = await LayoutDto.validateAsync(req.body);
          const layout = await this._dataService.updateLayout(id, data);
          res.status(201).json({ id: layout });
        }
      }
    } catch (error) {
      updateExpressResponseFromNativeError(
        res,
        new Error(`Failed to update layout ${error?.details?.[0]?.message || ''}`),
      );
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
      if (!id) {
        updateExpressResponseFromNativeError(res, new InvalidInputError('Missing parameter "id" of layout to delete'));
      } else {
        const { personid, name } = req.session;
        const { owner_name, owner_id } = await this._dataService.readLayout(id);
        if (owner_name !== name || owner_id !== personid) {
          updateExpressResponseFromNativeError(
            res,
            new UnauthorizedAccessError('Only the owner of the layout can delete it'),
          );
        } else {
          const result = await this._dataService.deleteLayout(id);
          res.status(200).json(result);
        }
      }
    } catch (error) {
      updateExpressResponseFromNativeError(res, new Error(`Unable to delete layout with id: ${id}`));
    }
  }

  /**
   * HTTP POST endpoint that validates received payload follows a layout format and if successful, stores it
   * @param {Request} req - HTTP request object with "body" information on layout to be created
   * @param {Response} res - HTTP request object with result of the action
   * @returns {undefined}
   */
  async postLayoutHandler(req, res) {
    let layout;
    try {
      layout = await LayoutDto.validateAsync(req.body);
    } catch (error) {
      updateExpressResponseFromNativeError(
        res,
        new InvalidInputError(`Failed to validate layout: ${error?.details[0]?.message || ''}`),
      );
      return;
    }
    try {
      const result = await this._dataService.createLayout(layout);
      res.status(201).json(result);
    } catch (error) {
      updateExpressResponseFromNativeError(res, new Error('Unable to create new layout'));
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
    if (!id) {
      updateExpressResponseFromNativeError(res, new InvalidInputError('Missing ID'));
    } else {
      let layout;
      try {
        layout = await LayoutPatchDto.validateAsync(req.body);
      } catch (error) {
        updateExpressResponseFromNativeError(res, new InvalidInputError('Invalid request body to update layout'));
        return;
      }

      try {
        const { personid } = req.session;
        const { owner_id } = await this._dataService.readLayout(id);

        if (owner_id !== personid) {
          updateExpressResponseFromNativeError(
            res,
            new UnauthorizedAccessError('Only the owner of the layout can update it'),
          );
        } else {
          const layoutUpdated = await this._dataService.updateLayout(id, layout);
          res.status(201).json(layoutUpdated);
        }
      } catch (error) {
        updateExpressResponseFromNativeError(res, new Error(`Unable to update layout with id: ${id}`));
      }
    }
  }
}
