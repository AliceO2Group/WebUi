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

import { LogManager } from '@aliceo2/web-ui';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';

/**
 * @class
 * Class which sets up the QCDB download service.
 */
export class QcdbDownloadService {
  /**
   * Constructor
   * @param {object} config - application's {config.js}.ccdb, needed for Qcdb hostname+port
   */
  constructor(config = {}) {
    this._hostname = config.hostname ?? 'localhost';
    this._port = config.port ?? 8080;
    this._protocol = config.protocol ?? 'http';
    this._target = `${this._protocol}://${this._hostname}:${this._port}`;

    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/proxy`);
    this._pipelineAsync = promisify(pipeline);
  }

  /**
   * Get ROOT object from qcdb.
   * If a response object is given it is assumed that this is the only request
   * the body of the answer from qcdb will then be streamed into our response.
   * @param {string} objectId - id of ROOT object to retrieve from qcdb.
   * @param {Express.Response} res - Optional Express response object if we want to stream qcdb's answer as our own.
   * @returns {File|boolean} - ROOT file from qcdb, false if error and true if it responded itself.
   */
  async requestObject(objectId, res = undefined) {
    this._logger.infoMessage(`Object ID Request: ${objectId}`);
    const qcdbRequest = new Request(`${this._target}/download/${objectId}`, { method: 'GET' });
    try {
      const response = await fetch(qcdbRequest);
      if (!response.ok) {
        this._logger.errorMessage(`QCDB returned ${response.status} ${response.statusText}`);
        throw new Error(`Cannot get ROOT file from qcdb object id: ${objectId}`);
      }
      const contentLength = response.headers.get('Content-Length');
      const contentType = response.headers.get('Content-Type');
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.slice(17, contentDisposition.length - 1);
      this._logger.infoMessage(`ROOT size: ${contentLength}`);
      // We will stream the data from QCDB's answer directly back to the user.
      if (res != undefined) {
        res.setHeader('Content-Type', contentType ?? 'application/root');
        res.setHeader('Content-Disposition', contentDisposition ?? `attachment; filename="${filename}"`);
        if (contentLength) {
          res.setHeader('Content-Length', contentLength);
        }

        await this._pipelineAsync(response.body, res);
        return true;
      } else {
        // We'll return the file from the response back.
        const blob = await response.blob();
        const file = new File([blob], filename ?? 'export.root', { type: contentType ?? 'application/root' });
        return file;
      }
    } catch (error) {
      this._logger.errorMessage(error);
      return false;
    }
  }

  /**
   * Get qcdb root objects from qcdb.
   * Only a single root object request supported for now.
   * @param {string} objectIds - Id of ROOT object to request.
   * @param {Express.Response} res - Express response object.
   */
  async getQcdbRootObjects(objectIds, res) {
    const promises = [];
    if (typeof objectIds === 'string') {
      promises.push(this.requestObject(objectIds, res));
    } else {
      // Technically this can be stopped at the DTO layer but multiple id's will be implemented soon.
      res.status(500).send('Option to retrieve more than 1 ROOT object not implemented yet.');
    }

    try {
      const files = await Promise.all(promises);
      if (files.filter((file) => file === false).length > 0) {
        throw new Error('qcdb object request failed.');
      }
    } catch (error) {
      this._logger.errorMessage(error.message);
      res.status(500).send("Unable to retrieve ROOT object('s)");
    }
  }
}
