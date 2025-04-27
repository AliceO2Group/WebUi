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
  InvalidInputError,
  NotFoundError,
  UnauthorizedAccessError,
  updateAndSendExpressResponseFromNativeError,
}
  from '@aliceo2/web-ui';
import { LayoutAdapter } from './adapters/layout-adapter.js';

/**
 * Gateway for all HTTP requests with regards to QCG Layouts
 */
export class LayoutController {
  /**
   * Setup Layout Controller:
   * @param {LayoutService} layoutService - An instance of LayoutService to interact with layout data.
   */
  constructor(layoutService) {
    assert(layoutService, 'Missing layout service');

    /**
     * @type {LayoutService}
     */
    this._layoutService = layoutService;
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
      let layouts = [];
      if (req.query.owner_id !== undefined) {
        const ownerId = parseInt(req.query.owner_id, 10);
        layouts = await this._layoutService.getLayoutsByOwnerId(ownerId);
      } else {
        layouts = await this._layoutService.getAllLayouts();
      }
      const adaptedLayouts = layouts.map((layout) => LayoutAdapter.adaptLayoutForExpressAPI(layout));

      res.status(200).json(adaptedLayouts);
    } catch {
      updateAndSendExpressResponseFromNativeError(res, new Error('Unable to retrieve layouts'));
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
        updateAndSendExpressResponseFromNativeError(res, new InvalidInputError('Missing parameter "id" of layout'));
      } else {
        const layout = await this._layoutService.getLayoutById(id);
        const adaptedLayout = LayoutAdapter.adaptLayoutForExpressAPI(layout);
        res.status(200).json(adaptedLayout);
      }
    } catch {
      updateAndSendExpressResponseFromNativeError(res, new Error(`Unable to retrieve layout with id: ${id}`));
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
    try {
      if (!id) {
        updateAndSendExpressResponseFromNativeError(res, new InvalidInputError('Missing parameter "id" of layout'));
      } else if (!req.body) {
        updateAndSendExpressResponseFromNativeError(
          res,
          new InvalidInputError('Missing body content to update layout with'),
        );
      } else {
        const { personid } = req.session;
        const layoutFound = await this._layoutService.getLayoutById(id);
        const owner_id = layoutFound.owner.id;

        if (Number(owner_id) !== Number(personid)) {
          updateAndSendExpressResponseFromNativeError(
            res,
            new UnauthorizedAccessError('Only the owner of the layout can update it'),
          );
        } else {
          let layoutProposed = {};
          try {
            layoutProposed = await LayoutDto.validateAsync(req.body);
          } catch (error) {
            updateAndSendExpressResponseFromNativeError(
              res,
              new Error(`Failed to update layout ${error?.details?.[0]?.message || ''}`),
            );
            return;
          }

          const layouts = await this._layoutService.getAllLayouts({ name: layoutProposed.name });
          const layoutExistsWithName = layouts.every((layout) => layout.id !== layoutProposed.id);
          if (layouts.length > 0 && layoutExistsWithName) {
            updateAndSendExpressResponseFromNativeError(
              res,
              new InvalidInputError(`Proposed layout name: ${layoutProposed.name} already exists`),
            );
            return;
          }
          const layout = await this._layoutService.updateLayout(id, layoutProposed);
          res.status(201).json({ id: layout });
        }
      }
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
      const result = await this._layoutService.deleteLayout(id);
      res.status(200).json(result);
    } catch {
      updateAndSendExpressResponseFromNativeError(res, new Error(`Unable to delete layout with id: ${id}`));
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
      const layouts = await this._layoutService.getAllLayouts({ name: layoutProposed.name });
      if (layouts.length > 0) {
        updateAndSendExpressResponseFromNativeError(
          res,
          new InvalidInputError(`Proposed layout name: ${layoutProposed.name} already exists`),
        );
        return;
      }
      const result = await this._layoutService.createLayout(layoutProposed);
      res.status(201).json(result);
    } catch {
      updateAndSendExpressResponseFromNativeError(res, new Error('Unable to create new layout'));
    }
  }

  /**
   * Patch a layout entity with information as per LayoutPatchDto.js
   * @param {Request} req - HTTP request object with "params" and "body" information on layout
   * @param {Response} res - HTTP response object to provide information on the update
   * @returns {undefined}
   */
  async patchLayoutHandler(req, res) {
    let layout = {};
    const { id } = req.params;
    if (!id) {
      updateAndSendExpressResponseFromNativeError(res, new InvalidInputError('Missing ID'));
      return;
    }
    try {
      layout = await LayoutPatchDto.validateAsync(req.body);
    } catch {
      updateAndSendExpressResponseFromNativeError(
        res,
        new InvalidInputError('Invalid request body to update layout'),
      );
      return;
    }

    try {
      await this._layoutService.getLayoutById(id);
    } catch {
      updateAndSendExpressResponseFromNativeError(res, new NotFoundError(`Unable to find layout with id: ${id}`));
      return;
    }
    try {
      const layoutUpdated = await this._layoutService.updateLayout(id, layout);
      res.status(201).json(layoutUpdated);
    } catch {
      updateAndSendExpressResponseFromNativeError(res, new Error(`Unable to update layout with id: ${id}`));
      return;
    }
  }
}
