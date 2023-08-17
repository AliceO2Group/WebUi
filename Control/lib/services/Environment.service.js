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

const EnvironmentInfoAdapter = require('./../adapters/EnvironmentInfoAdapter');

/**
 * EnvironmentService class to be used to retrieve data from AliEcs Core via the gRPC Control client
 */
class EnvironmentService {
  /**
   * Constructor for inserting dependencies needed to retrieve environment data
   * @param {GrpcProxy} coreGrpc 
   * @param {ApricotProxy} apricotGrpc 
   */
  constructor(coreGrpc, apricotGrpc) {
    this._coreGrpc = coreGrpc;
    this._apricotGrpc = apricotGrpc;
  }

  /**
   * Given an environment ID, use the gRPC client to retrieve needed information
   * Parses the environment and prepares the information for GUI purposes
   * @param {string} id - environment id as defined by AliECS Core
   * @param {string} taskSource - Source of where to request tasks from: FLP, EPN, QC, TRG
   * @return {EnvironmentDetails}
   * @throws {Error}
   */
  async getEnvironment(id, taskSource) {
    const {environment} = await this._coreGrpc['GetEnvironment']({id});
    const detectorsAll = this._apricotGrpc.detectors ?? [];
    const hostsByDetector = this._apricotGrpc.hostsByDetector ?? {};
    const environmentInfo = EnvironmentInfoAdapter.toEntity(environment, taskSource, detectorsAll, hostsByDetector);
    
    return environmentInfo;
  }
}

module.exports = {EnvironmentService};
