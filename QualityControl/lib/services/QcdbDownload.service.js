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
  }

  /**
   * Get ROOT object from qcdb
   * @param {string} objectId - id of ROOT object to retrieve from qcdb.
   * @returns {File} - ROOT file from qcdb.
   */
  async requestObject(objectId) {
    const myRequest = new Request(`${this._target}/download/${objectId}`, { method: 'GET' });
    try {
      const response = await fetch(myRequest);
      if (!response.ok) {
        throw new Error(`Cannot get objectId from qcdb: ${objectId}`);
      }
      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      const fileName = contentDisposition?.slice(17, contentDisposition.length - 1);
      const file = new File([blob], fileName ?? 'export.root', { type: 'application/root' });
      return file;
    } catch (error) {
      this._logger.errorMessage(error);
      return null;
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
      promises.push(this.requestObject(objectIds));
    } else {
      // Technically this can be stopped at the DTO layer but multiple will be implemented soon.
      res.status(500).send('Option to retrieve more than 1 ROOT object not implemented yet.');
    }

    try {
      const files = await Promise.all(promises);
      if (files.filter((file) => file === null).length > 0) {
        throw new Error('qcdb object request failed.');
      }
      this._logger.infoMessage(`Object ID Requests: ${objectIds}`);

      if (files.length === 1) {
        res.setHeader('Content-Type', 'application/root');
        res.setHeader('Content-Disposition', `attachment; filename="${files[0].name}"`);
        res.setHeader('Content-Length', files[0].size);

        pipeline(files[0].stream(), res, (err) => {
          if (err) {
            throw err;
          }
        });
      }
    } catch (error) {
      this._logger.errorMessage(error.message);
      res.status(500).send("Unable to retrieve ROOT object('s)");
    }
  }
}
