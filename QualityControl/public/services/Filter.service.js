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

import { RemoteData } from '/js/src/index.js';
import { RunStatus } from '../../library/runStatus.enum.js';

/**
 * Service to get the data to populate the filters
 */
export default class FilterService {
  /**
   * Initialize filterModel
   * @param {FilterModel} filterModel - The root filterModel that manages filter state
   */
  constructor(filterModel) {
    this.filterModel = filterModel;
    this.loader = filterModel.model.loader;

    this._runTypes = RemoteData.notAsked();
    this._detectors = RemoteData.notAsked();
    this._dataPasses = RemoteData.notAsked();

    this._ongoingRuns = RemoteData.notAsked();
  }

  /**
   * Method to get all run types to show in the filter
   * @returns {RemoteData} - result within a RemoteData object
   */
  async getFilterConfigurations() {
    this._runTypes = RemoteData.loading();
    this._detectors = RemoteData.loading();
    this._dataPasses = RemoteData.notAsked();
    this.filterModel.notify();
    const { result, ok } = await this.loader.get('/api/filter/configuration');
    if (ok) {
      this._runTypes = RemoteData.success(result?.runTypes || []);
      this._detectors = RemoteData.success(result?.detectors || []);
      this._dataPasses = RemoteData.success(result?.dataPasses || []);
    } else {
      this._runTypes = RemoteData.failure('Error retrieving runTypes');
      this._detectors = RemoteData.failure('Error retrieving detectors');
      this._dataPasses = RemoteData.failure('Error retrieving dataPasses');
    }
    this.filterModel.notify();
  }

  /**
   * Method to get run status for a specific run number
   * @param {number} runNumber - The run number to get status for
   * @returns {object} - result as an object containing run information
   */
  async getRunInformation(runNumber) {
    const parsedRunNumber = parseInt(runNumber, 10);
    const { result, ok } = await this.loader.get(`/api/filter/run-status/${parsedRunNumber}`);
    return ok ? result : {};
  }

  /**
   * Method to get run status for a specific run number
   * @param {number} runNumber - The run number to get status for
   * @returns {RunStatus} - result as a run status
   */
  async getRunStatus(runNumber) {
    const { runStatus } = await this.getRunInformation(runNumber);
    return runStatus ?? RunStatus.UNKNOWN;
  }

  /**
   * Method to initialize the filter service
   * @returns {void}
   */
  async initFilterService() {
    await this.getFilterConfigurations();
  }

  /**
   * Method which will return RemoteData object based on the status of the request
   * @param {object} result - value to be added in RemoteData object
   * @param {boolean} ok - whether result was ok or not
   * @returns {RemoteData} - passed result in a RemoteData object
   */
  parseResult(result, ok) {
    if (!ok) {
      return RemoteData.failure(result.error || result.message);
    } else {
      return RemoteData.success(result);
    }
  }

  /**
   * Gets the run numbers for the ongoing runs
   * @returns {void} assigns the remoteData object to ongoingRuns
   */
  async fetchOngoingRuns() {
    this._ongoingRuns = RemoteData.loading();
    this.filterModel.notify();
    const { result, ok } = await this.loader.get('/api/filter/ongoingRuns');
    if (ok) {
      this._ongoingRuns = RemoteData.success(result?.ongoingRuns);
    } else {
      this._ongoingRuns = RemoteData.failure('Error retrieving ongoing runs');
    }
    this.filterModel.notify();
  }

  /**
   * Gets the list of run types.
   * @returns {string[]} An array containing the run types.
   */
  get runTypes() {
    return this._runTypes;
  }

  /**
   * Gets the list of detectors.
   * @returns {DetectorSummary[]} An array containing detector objects.
   */
  get detectors() {
    return this._detectors;
  }

  /**
   * Returns a {@link RemoteData} object containing an array of data type {@link DataPass}.
   * @returns {RemoteData<DataPass[]>} A {@link RemoteData} object containing an array of data type {@link DataPass}.
   */
  get dataPasses() {
    return this._dataPasses;
  }

  /**
   * Gets the list of ongoing runs.
   * @returns {RemoteData<number[]>} An array containing the ongoing run numbers.
   */
  get ongoingRuns() {
    return this._ongoingRuns;
  }
}
