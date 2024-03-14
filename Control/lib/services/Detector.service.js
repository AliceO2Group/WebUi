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
 * @class
 * DetectorService class is to be used for retrieving information from AliECS Core/Apricot about the currently used detectors
 */
class DetectorService {
  /**
   * @constructor
   * Constructor for initializing the service with gRPC core service
   * @param {CoreProxy} coreGrpc - interface to interact with gRPC AliECS core service
   */
  constructor(coreGrpc) {
    /**
     * @type {CoreProxy}
     */
    this._coreGrpc = coreGrpc;
  }

  /**
   * Method to retrieve which detectors are currently active and compare to received input
   * @param {Array<String>} detectors - list of strings with detector name
   * @return {boolean}
   * @throws {gRPCError}
   */
  async areDetectorsAvailable(detectors) {
    const {detectors: activeDetectors} = await this._coreGrpc['GetActiveDetectors']();
    const areDetectorsNonActive = detectors.every((detector) => !activeDetectors.includes(detector));
    return areDetectorsNonActive;
  }
}

module.exports = {DetectorService};
