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

const {LogManager, updateAndSendExpressResponseFromNativeError, ServiceUnavailableError} = require('@aliceo2/web-ui');
const LOG_LABEL = `${process.env.npm_config_log_label ?? 'cog'}/verify-det-availability`;

/**
 * Factory function which retrieves the currently active detectors across ECS and checks if requested ones are available
 *
 * @param {DetectorService} detectorService - service to be used to retrieve detectors information
 * @return {function(req, res, next): void} - middleware function
 */
const verifyDetectorsAvailabilityMiddlewareFactory = (detectorService) => {
  /**
   * Middleware function to extract the active detectors from ECS and check if the requested ones are available
   * @param {Request} req - HTTP Request object
   * @param {object} req.body - Body object from request
   * @param {string} req.body.detectors - detectors requested for deployment
   * @param {Response} res - HTTP Response object
   * @param {Next} next - HTTP Next object to use if checks pass
   * @return {void} continue if checks pass, 400 if environment ID is missing
   */
  return async (req, res, next) => {
    const {detectors = []} = req.body ?? {};

    try {
      const areDetectorsAvailable = await detectorService.areDetectorsAvailable(detectors);
      if (!areDetectorsAvailable) {
        throw new ServiceUnavailableError(`Requested detectors ${detectors} are not available`);
      }
      next();
    } catch (error) {
      const logger = LogManager.getLogger(LOG_LABEL);
      logger.errorMessage(error);
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  };
};

exports.verifyDetectorsAvailabilityMiddlewareFactory = verifyDetectorsAvailabilityMiddlewareFactory;
