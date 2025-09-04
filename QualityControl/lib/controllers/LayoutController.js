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
  NotFoundError,
  updateAndSendExpressResponseFromNativeError,
}
  from '@aliceo2/web-ui';

/**
 * @typedef {import('../repositories/LayoutRepository.js').LayoutRepository} LayoutRepository
 */

const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/layout-ctrl`);

/**
 * Gateway for all HTTP requests with regards to QCG Layouts
 */
export class LayoutController {
  /**
   * Setup Layout Controller:
   * @param {LayoutRepository} layoutRepository - The repository for layout data
   */

  constructor(layoutRepository) {
    assert(layoutRepository, 'Missing layout repository');

    /**
     * @type {LayoutRepository}
     */
    this._layoutRepository = layoutRepository;
  }

  /**
   * HTTP GET endpoint for retrieving a list of layouts
   * * can be filtered by "owner_id" or "object_path"
   * * if no owner_id is provided, all layouts will be fetched;
   * @param {Request} req - HTTP request object with information on owner_id
   * @param {Response} res - HTTP response object to provide layouts information
   * @returns {undefined}
   */
  async getLayoutsHandler(req, res) {
    let fields = undefined;
    let owner_id = undefined;
    let object_path = undefined;

    try {
      const validated = await LayoutsGetDto.validateAsync(req.query);
      ({ fields, owner_id, object_path } = validated);
    } catch (error) {

      const responseError = error.isJoi ?
        new InvalidInputError(`Invalid query parameters: ${error.details[0].message}`) :
        new Error('Unable to process request');

      logger.errorMessage(`Error validating query parameters: ${error}`);
      return updateAndSendExpressResponseFromNativeError(res, responseError);
    }

    try {
      const layouts = await this._layoutRepository.listLayouts({ owner_id, fields });
      return res.status(200).json(layouts);
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
    if (!id.trim()) {
      updateAndSendExpressResponseFromNativeError(res, new InvalidInputError('Missing parameter "id" of layout'));
    } else {
      try {
        const layout = await this._layoutRepository.readLayoutById(id);
        res.status(200).json(layout);
      } catch (error) {
        updateAndSendExpressResponseFromNativeError(res, error);
      }
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
      const layout = await this._layoutRepository.readLayoutByName(layoutName);
      res.status(200).json(layout);
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
    let layoutProposed = {};
    try {
      layoutProposed = await LayoutDto.validateAsync(req.body);
    } catch (error) {
      updateAndSendExpressResponseFromNativeError(
        res,
        new InvalidInputError(`Failed to update layout: ${error?.details?.[0]?.message || ''}`),
      );
      return;
    }
    try {
      const layouts = await this._layoutRepository.listLayouts({ name: layoutProposed.name });
      const layoutExistsWithName = layouts.every((layout) => layout.id !== layoutProposed.id);
      if (layouts.length > 0 && layoutExistsWithName) {
        updateAndSendExpressResponseFromNativeError(
          res,
          new InvalidInputError(`Proposed layout name: ${layoutProposed.name} already exists`),
        );
        return;
      }
      const layout = await this._layoutRepository.updateLayout(id, layoutProposed);
      res.status(201).json({ id: layout });
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
      const result = await this._layoutRepository.deleteLayout(id);
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
      const layouts = await this._layoutRepository.listLayouts({ name: layoutProposed.name });
      if (layouts.length > 0) {
        updateAndSendExpressResponseFromNativeError(
          res,
          new InvalidInputError(`Proposed layout name: ${layoutProposed.name} already exists`),
        );
        return;
      }
      const result = await this._layoutRepository.createLayout(layoutProposed);
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
    const { id } = req.params;
    let layout = {};
    try {
      layout = await LayoutPatchDto.validateAsync(req.body);
    } catch (error) {
      updateAndSendExpressResponseFromNativeError(
        res,
        new InvalidInputError(`Failed to validate layout: ${error?.details[0]?.message || ''}`),
      );
      return;
    }
    try {
      this._layoutRepository.readLayoutById(id);
    } catch {
      updateAndSendExpressResponseFromNativeError(res, new NotFoundError(`Unable to find layout with id: ${id}`));
      return;
    }
    try {
      const updatedLayoutId = await this._layoutRepository.updateLayout(id, layout);
      res.status(201).json({ id: updatedLayoutId });
    } catch {
      updateAndSendExpressResponseFromNativeError(res, new Error(`Unable to update layout with id: ${id}`));
      return;
    }
  }
}
