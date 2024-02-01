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

const {Log} = require('@aliceo2/web-ui');

const {CacheKeys} = require('../common/cacheKeys.enum.js');
const {grpcErrorToNativeError} = require('./../errors/grpcErrorToNativeError.js');
const {LOG_LEVEL} = require('./../common/logLevel.enum.js');
const {RunCalibrationStatus} = require('./../common/runCalibrationStatus.enum.js');
const {RunDefinitions} = require('./../common/runDefinition.enum.js')
const {RUNTIME_COMPONENT: {COG}, RUNTIME_KEY: {CALIBRATION_MAPPING}} = require('./../common/kvStore/runtime.enum.js');

/**
 * @class
 * RunService class to be used for retrieving and building information on runs(active/previous) from Bookkeeping:
 * * store in-memory information with regards to runTypes(name-id mapping), calibration per detector mappings, etc.
 * * displaying latest calibration runs as per mapping defined in KV Store
 * * allowing user to deploy calibration runs and follow their progress via streams
 */
class RunService {
  /**
   * @constructor
   * Constructor for configuring the service to retrieve data via passed services
   * @param {BookkeepingService} bkpService - service for retrieving RUNs information
   * @param {ApricotService} apricotService - service for retrieving information through AliECS Apricot gRPC connection, mainly KV Store data
   * @param {CacheService} cacheService - service to store information in-memory
   */
  constructor(bkpService, apricotService, cacheService) {
    /**
     * @type {BookkeepingService}
     */
    this._bkpService = bkpService;

    /**
     * @type {ApricotService}
     */
    this._apricotService = apricotService;

    /**
     * @type {CacheService}
     */
    this._cacheService = cacheService;

    /**
     * @type {Object<String, Number>}
     */
    this._runTypes = {};

    /**
     * Contains an object with list of run types that should be fetched for each detector
     * @type {Object<String, Array<String>>}
     */
    this._calibrationConfigurationPerDetectorMap = {};

    this._logger = new Log(`${process.env.npm_config_log_label ?? 'cog'}/run-service`);
  }

  /**
   * Method to initialize the service with data such as runTypes and calibration mappings
   * @return {void}
   */
  async load() {
    this._calibrationConfigurationPerDetectorMap = await this._retrieveCalibrationConfigurationsForDetectors();
    this._runTypes = await this._bkpService.getRunTypes();
    await this.retrieveCalibrationRunsGroupedByDetector();
  }

  /**
   * Based on already loaded calibration configuration mapping from KV store, retrieve runs with those characteristics from Bookkeeping
   * @return {Promise<Object<String(Detector), Map<String(RunType), Object(CalibrationConfiguration, RunSummary, RunSummary)>.Error>} - list of calibration runs grouped by detector
   */
  async retrieveCalibrationRunsGroupedByDetector() {
    const calibrationRunsPerDetector = {};
    for (const detector in this._calibrationConfigurationPerDetectorMap) {
      const calibrationConfigurationList = this._calibrationConfigurationPerDetectorMap[detector] ?? [];
      calibrationRunsPerDetector[detector] = {};
      for (const calibrationConfiguration of calibrationConfigurationList) {
        const runTypeId = this._runTypes[calibrationConfiguration.runType];
        const lastCalibrationRun = await this._bkpService.getRun({
          definitions: RunDefinitions.CALIBRATION,
          runTypes: runTypeId,
          detectors: detector
        });
        const lastSuccessfulCalibrationRun = await this._bkpService.getRun({
          definitions: RunDefinitions.CALIBRATION,
          runTypes: runTypeId,
          detectors: detector,
          calibrationStatuses: RunCalibrationStatus.SUCCESS
        });
        calibrationRunsPerDetector[detector][calibrationConfiguration.runType] = {
          configuration: calibrationConfiguration,
          lastCalibrationRun: lastCalibrationRun ?? null,
          lastSuccessfulCalibrationRun: lastSuccessfulCalibrationRun ?? null,
        };
      }
    }
    // done in a separate loop to avoid race condition generated by waiting on Bookkeeping
    for (const detector in this._calibrationConfigurationPerDetectorMap) {
      const calibrationConfigurationList = this._calibrationConfigurationPerDetectorMap[detector] ?? [];
      for (const {runType} of calibrationConfigurationList) {
        const ongoingRequests = this._cacheService?.getByKey(CacheKeys.CALIBRATION_RUNS_REQUESTS);
        const ongoingCalibrationRun = ongoingRequests?.[detector]?.[runType] ?? null;
        calibrationRunsPerDetector[detector][runType].ongoingCalibrationRun = ongoingCalibrationRun;
      }
    }
    this._cacheService?.updateByKeyAndBroadcast(
      CacheKeys.CALIBRATION_RUNS_BY_DETECTOR,
      calibrationRunsPerDetector,
      {command: CacheKeys.CALIBRATION_RUNS_BY_DETECTOR}
    );
    return calibrationRunsPerDetector;
  }

  /*
   * Private Loaders
   */

  /**
   * Load calibration mapping for each detector as per the KV store
   * @return {Promise<Object<String, CalibrationConfiguration.Error>} - map of calibration configurations
   *  
   * @example 
   * { "XYZ": [ { "runType": "PEDESTAL", "configuration": "cpv-pedestal-20220412", "label": "CPV PEDESTAL" }]}
   */
  async _retrieveCalibrationConfigurationsForDetectors() {
    try {
      const calibrationMappings = await this._apricotService.getRuntimeEntryByComponent(COG, CALIBRATION_MAPPING);
      return JSON.parse(calibrationMappings);
    } catch (error) {
      const err = grpcErrorToNativeError(error);
      this._logger.errorMessage(`Unable to load calibration mapping due to: ${err}`,
        {level: LOG_LEVEL.OPERATIONS, system: 'GUI', facility: 'calibration-service'}
      )
    }
    return {};
  }

  /**
   * Getters & Setters
   */

  /**
   * Return the KV object for runType with its id
   * @return {Object<String, Number>} - mapping of run types to their bookkeeping ID
   */
  get runTypes() {
    return this._runTypes;
  }

  /**
   * Return the object containing a KV object with detector and its corresponding run types needed for calibration runs
   * @return {Object<String, Array<String>>}
   */
  get runTypesPerDetectorStoredMapping() {
    return this._calibrationConfigurationPerDetectorMap;
  }

}

module.exports = {RunService};
