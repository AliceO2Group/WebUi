/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

const {LogManager, updateAndSendExpressResponseFromNativeError, InvalidInputError} = require('@aliceo2/web-ui');
const LOG_LABEL = `${process.env.npm_config_log_label ?? 'cog'}/get-set-det-for-env`;

/**
 * Factory function which retrieves the included detectors in an environment and add a list(can be empty) of them to the request body
 *
 * @param {EnvironmentService} environmentService - service to be used to retrieve environment information
 * @return {function(req, res, next): void} - middleware function
 */
const setDetectorsFromEnvironmentMiddlewareFactory = (environmentService) => {
  /**
   * Middleware function to extract the environment included detectors and add them to the request body
   * @param {Request} req - HTTP Request object
   * @param {object} req.body - Body object from request
   * @param {string} req.body.id - ID of the environment to retrieve detectors for
   * @param {Response} res - HTTP Response object
   * @param {Next} next - HTTP Next object to use if checks pass
   * @return {void} continue if checks pass, 400 if environment ID is missing
   */
  return async (req, res, next) => {
    const {id = ''} = req.body ?? {};

    try {
      if (!id) {
        throw new InvalidInputError('Invalid input: environment id must be provided');
      } 
      const { includedDetectors = [] } = await environmentService.getEnvironment(id);
      if (!req.body) {
        req.body = {};
      }
      req.body.detectors = includedDetectors;
      next();
    } catch (error) {
      const logger = LogManager.getLogger(LOG_LABEL);
      logger.errorMessage(error);
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  };
};

exports.setDetectorsFromEnvironmentMiddlewareFactory = setDetectorsFromEnvironmentMiddlewareFactory;
