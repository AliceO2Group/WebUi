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

import { createProxyServer } from 'http-proxy-3';
import { LogManager } from '@aliceo2/web-ui';

/**
 * @class
 * Class which sets up the proxy server to QCDB
 */
export class QcdbProxyService {
  /**
   * Constructor
   * @param {object} config - application's {config.js}.ccdb, needed for Qcdb hostname+port
   */
  constructor(config = {}) {
    this._hostname = config.hostname ?? 'localhost';
    this._port = config.port ?? 8080;
    this._protocol = config.protocol ?? 'http';
    this.target = `${this._protocol}://${this._hostname}:${this._port}/`;

    const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/proxy`);
    this.proxy = createProxyServer({});
    logger.infoMessage('QCDB Proxy is ready');
  }

  /**
   * Proxy the request to QCDB.
   * @param {Request} req - ExpressJs req object.
   * @param {Response} res - ExpressJs res object.
   */
  qcdbProxyRouter(req, res) {
    this.proxy.web(req, res, { target: this.target });
  }
}
