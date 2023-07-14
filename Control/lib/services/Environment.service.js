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
 * EnvironmentService class to be used to retrieve data from AliEcs Core via the gRPC Control client
 */
class EnvironmentService {
  /**
   * Constructor for inserting dependencies needed to retrieve environment data
   * @param {GrpcProxy} coreGrpc 
   */
  constructor(coreGrpc) {
    this._coreGrpc = coreGrpc;
  }

  /**
   * Given an environment ID, use the gRPC client to retrieve needed information
   * @param {string} id - environment id as defined by AliECS Core
   * @return {EnvironmentDetails}
   * @throws {Error}
   */
  async getEnvironment(id) {
    const {environment} = await this._coreGrpc['GetEnvironment']({id});
    return environment;
  }
}

module.exports = {EnvironmentService};
