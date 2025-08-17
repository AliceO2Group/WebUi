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

/**
 * Factory function to check if consul service is available
 *
 * @param {ConsulService} consulService - service for which availability is checked
 * @returns {function(req, res, next): void} - middleware function
 */
const validateConsulServiceMiddlewareFactory = (consulService) => {
  /**
   * Middleware function to check if consul service is available
   * @param {Request} req - HTTP Request object
   * @param {Response} res - HTTP Response object
   * @param {Next} next - HTTP Next object to use if checks pass
   * @returns {void} continue if checks pass, uses response object to respond with error if checks fail
   */
  return async (req, res, next) => {
    if (consulService) {
      next();
    } else {
      res.status(502).json({ message: "Unable to retrieve configuration of consul service" });
    }
  };
};

exports.validateConsulServiceMiddlewareFactory = validateConsulServiceMiddlewareFactory;
