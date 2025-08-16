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

/**
 * Check whether provided service was configured and if so whether is available or not
 * @param {object} service - Service object to check
 * @returns {Function} Express middleware function
 */
const serviceAvailabilityCheck = (service) =>

  /**
   * Express middleware function
   * @param {Request} req - HTTP request object
   * @param {Response} res - HTTP response object
   * @param {Function} next - Next middleware function
   * @returns {void} - calls next or res depending on service availability
   */
  (req, res, next) => {
    if (service && service?.isAvailable) {
      next();
    } else if (service && !service?.isAvailable) {
      res.status(503).json({ message: 'Service is not available' });
    } else {
      res.status(503).json({ message: 'Service is not configured' });
    }
  };

module.exports.serviceAvailabilityCheck = serviceAvailabilityCheck;
