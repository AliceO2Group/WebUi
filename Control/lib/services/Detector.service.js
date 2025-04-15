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

const { grpcErrorToNativeError } = require('@aliceo2/web-ui');

/**
 * @class
 * DetectorService class is to be used for retrieving information from AliECS Core/Apricot about the currently used detectors
 */
class DetectorService {
  /**
   * Constructor for initializing the service with ECS gRPC service client
   * @param {GrpcServiceClient} ecsGrpcClient - service to interact via gRPC client with AliECS core
   */
  constructor(ecsGrpcClient) {
    /**
     * @type {GrpcServiceClient}
     */
    this._ecsGrpcClient = ecsGrpcClient;
  }

  /**
   * Method to return whether the provided detectors are inactive by querying the ECS grpc service
   * @param {Array<string>} detectorsToCheck - list of strings with detector name that should be checked
   * @returns {boolean} - true if the provided detectors are inactive
   * @throws {Error}
   */
  async areDetectorsAvailable(detectorsToCheck) {
    try {
      const { detectors } = await this._ecsGrpcClient.GetActiveDetectors();
      const areProvidedDetectorsInactive = detectorsToCheck.every((detector) => !detectors.includes(detector));
      return areProvidedDetectorsInactive;
    } catch (error) {
      throw grpcErrorToNativeError(error);
    }
  }
}

module.exports = {DetectorService};
