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

const { grpcErrorToNativeError, LogManager, LogLevel } = require('@aliceo2/web-ui');

/**
 * @class
 * DetectorService class is to be used for retrieving information from AliECS Core/Apricot about the currently used detectors
 */
class DetectorService {
  /**
   * Constructor for initializing the service with ECS and Apricot gRPC service clients
   * @param {GrpcServiceClient} ecsGrpcClient - service to interact via gRPC client with AliECS core
   * @param {GrpcServiceClient} apricotGrpcClient - service to interact via gRPC client with AliECS Apricot
   */
  constructor(ecsGrpcClient, apricotGrpcClient) {
    /**
     * @type {GrpcServiceClient}
     */
    this._ecsGrpcClient = ecsGrpcClient;

    /**
     * @type {GrpcServiceClient}
     */
    this._apricotGrpcClient = apricotGrpcClient;

    /**
     * @type {Array<string>}
     */
    this._detectors = [];

    /**
     * @type {Map<string, Array<string>>}
     */
    this._hostsByDetector = new Map();

    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cog'}/detectorservice`);
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

  /**
   * Method to retrieve detectors list from ECS via Apricot gRPC service
   * In the received list, remove empty or whitespace-only values from response.
   * Keep the list of detectors cached in memory for future calls.
   * @returns {Promise<Array<string>>} - list of non-empty detectors
   * @throws {Error} - throws JS native error converted from gRPC error in case of failure
   */
  async getDetectorList() {
    if (this._detectors.length > 0) {
      return this._detectors;
    }

    try {
      const { detectors = [] } = await this._apricotGrpcClient.ListDetectors();
      this._detectors = detectors.filter((detector) => typeof detector === 'string' && detector.trim().length > 0);
      return this._detectors;
    } catch (grpcError) {
      throw grpcErrorToNativeError(grpcError);
    }
  }

  /**
   * Method to retrieve a map of hosts grouped by their detector via Apricot gRPC service.
   * If the in-memory cache is non-empty, it is returned directly without querying Apricot.
   * Individual detector failures are non-fatal; the partial result is cached and returned.
   * @returns {Promise<Map<string, Array<string>>>} - map of detector name to list of hosts
   * @throws {Error} - throws JS native error converted from gRPC error if detector list fetch fails
   */
  async getHostsByDetector() {
    if (this._hostsByDetector.size > 0) {
      return this._hostsByDetector;
    }

    const detectors = await this.getDetectorList();
    await Promise.allSettled(
      detectors.map(async (detector) => {
        try {
          const { hosts } = await this._apricotGrpcClient.GetHostInventory({ detector });
          const filteredHosts = hosts.filter((host) => typeof host === 'string' && host.trim().length > 0);
          this._hostsByDetector.set(detector, filteredHosts);
        } catch (error) {
          this._logger.errorMessage(`Failed to retrieve hosts for detector ${detector}: ${error.message}`);
        }
      })
    );
    return this._hostsByDetector;
  }

  /**
   * Getter for the list of detectors cached in memory
   * @returns {Array<string>}
   */
  get detectors() {
    return this._detectors;
  }

  /**
   * Setter for the list of detectors cached in memory
   * @param {Array<string>} detectors - list of strings with detector names to be cached in memory
   */
  set detectors(detectors) {
    this._detectors = detectors;
  }

  /**
   * Getter for the hosts-by-detector map cached in memory
   * @returns {Map<string, Array<string>>}
   */
  get hostsByDetector() {
    return this._hostsByDetector;
  }
}

module.exports = {DetectorService};
