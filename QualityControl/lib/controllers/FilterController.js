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
 * Gateaway class to be used to retrieve data with regard to filters
 */
export class FilterController {
  constructor(bkpService) {
    /**
     * @type {BookkeepingService}
     */
    this._bkpService = bkpService;
  }

  /**
   * HTTP GET endpoint for retrieving a list of run types from Bookkeeping
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response to provide run types information
   */
  async getRunTypesHandler(req, res) {
    try {
      if (!this._bkpService) {
        throw new Error('Bookkeeping service is not available');
      }
      res.status(200).json(this._bkpService.runTypes);
    } catch (error) {
      res.status(503).json({ error: error.message || error });
    }
  }
}
