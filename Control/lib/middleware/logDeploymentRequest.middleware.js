/**
 * @license
 * Copyright 2019-2024 CERN and copyright holders of ALICE O2.
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

const {LogManager, LogLevel} = require('@aliceo2/web-ui');

/**
 * Middleware to log deployment requests with user and request context.
 * @param {Express.Request} req - Request object
 * @param {Express.Response} _ - Response object
 * @param {Express.Next} next - Next middleware function
 * @return {void}
 */
const logDeploymentRequestMiddleware = (req, _, next) => {
  /**
   * @type {DeploymentRequest}
   */
  const { selectedConfiguration, workflowTemplate, detectors = [] } = req.body;
  const { username } = req.session;

  const logMessage = `Deployment request from user: ${ username }`
    + (workflowTemplate ? ` for workflow: ${workflowTemplate}` : '')
    + (selectedConfiguration ? ` with configuration: ${selectedConfiguration}` : '')
    + ` with detectors: ${detectors.length > 0 ? detectors.join(', ') : 'none'}`;

  LogManager
    .getLogger(`${process.env.npm_config_log_label ?? 'cog'}/deployment-request`)
    .infoMessage(logMessage, {
      level: LogLevel.OPERATIONS,
    });
  next();
}

module.exports = { logDeploymentRequestMiddleware };
