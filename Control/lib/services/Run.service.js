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
const {grpcErrorToNativeError} = require('./../errors/grpcErrorToNativeError.js');

const {RUNTIME_COMPONENT: {COG}, RUNTIME_KEY: {CALIBRATION_MAPPING}} = require('./../common/kvStore/runtime.enum.js');
const {RUN_DEFINITIONS} = require('./../common/runDefinition.enum.js')
const {LOG_LEVEL} = require('../common/logLevel.enum.js');

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
   */
  constructor(bkpService, apricotService) {
    /**
     * @type {BookkeepingService}
     */
    this._bkpService = bkpService;

    /**
     * @type {ApricotService}
     */
    this._apricotService = apricotService;

    /**
     * @type {Object<String, Number>}
     */
    this._runTypes = {};

    /**
     * @type {Object<String, Array<String>>}
     */
    this._calibrationPerDetectorMap = {};

    /**
     * @type {Object<String, Array<RunSummary>>}
     */
    this._calibrationRunsPerDetector = {};

    this._logger = new Log(`${process.env.npm_config_log_label ?? 'cog'}/run-service`);
  }

  /**
   * Method to initialize the service with data such as runTypes and calibration mappings
   * @return {void}
   */
  async init() {
    this._calibrationPerDetectorMap = await this._retrieveCalibrationForDetector();
    this._runTypes = await this._bkpService.getRunTypes();
    this._calibrationRunsPerDetector = await this.retrieveCalibrationRunsGroupedByDetector();
  }

  /**
   * Based on already loaded calibration configuration mapping from KV store, retrieve runs with those characteristics from Bookkeeping
   * @return {Promise<Object<String, Array<RunSummary>.Error>} - list of calibration runs grouped by detector
   */
  async retrieveCalibrationRunsGroupedByDetector() {
    const calibrationRunsPerDetector = {};
    for (const detector in this._calibrationPerDetectorMap) {
      const runTypesPerDetector = this._calibrationPerDetectorMap[detector] ?? [];
      calibrationRunsPerDetector[detector] = [];
      for (const runType of runTypesPerDetector) {
        const runTypeId = this._runTypes[runType];
        const runInfo = await this._bkpService.getRun(RUN_DEFINITIONS.CALIBRATION, runTypeId, detector);
        if (runInfo) {
          calibrationRunsPerDetector[detector].push(runInfo);
        }
      }
    }
    this._calibrationRunsPerDetector = calibrationRunsPerDetector;
    return calibrationRunsPerDetector;
  }

  /*
   * Private Loaders
   */

  /**
   * Load calibration mapping for each detector as per the KV store
   * @return {Promise<Object.Error>} - map of calibration configuration
   *  
   * @example 
   * { "XYZ": ["CALIB1", "CALIB2"], "ABC": ["XCALIB"] }
   */
  async _retrieveCalibrationForDetector() {
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
  get calibrationPerDetectorMap() {
    return this._calibrationPerDetectorMap;
  }

  /**
   * Return the object containing a KV object with detector and its corresponding last calibration runs
   * @return {Object<String, Array<RunSummary>>}
   */
  get calibrationRunsPerDetector() {
    return this._calibrationRunsPerDetector;
  }
}

module.exports = {RunService};