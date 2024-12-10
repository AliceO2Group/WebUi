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

/**
 * Middleware function to add detectorID to the request object
 * @param {Request} req - HTTP Request object
 * @param {Next} next - HTTP Next object to use if checks pass
 * @param {Response} res - HTTP Response object
 * @return {void}
 */
const addDetectorIdMiddleware = (detectorId) => {
  return async (req, res, next) => {
    req.params.detectorId = detectorId;
    next();
  };
}

exports.addDetectorIdMiddleware = addDetectorIdMiddleware
