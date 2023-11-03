/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

import {Observable, RemoteData} from '/js/src/index.js';

/**
 * Model to store the state of the page representing calibration runs and associated actions
 */
export class CalibrationRunsModel extends Observable {
  /**
   * Constructor
   * @param {Model} model - the global model
   */
  constructor(model) {
    super();

    /**
     * @type {Model}
     */
    this._model = model;

    /**
     * Object containing list of calibration runs grouped by their detector
     * @example
     * RemoteData {
     *  "TPC": [
     *    {
     *      configuration: <CalibrationConfiguration>,
     *      ongoingCalibrationRun: RemoteData<EnvironmentSummary>,
     *      lastCalibrationRun: <RunSummary>,
     *      lastSuccessfulCalibrationRun: <RunSummary>
     *    },
     *  ]
     * }
     */
    this._calibrationRuns = RemoteData.notAsked();
  }

  /**
   * Initialize model for environment creation page
   */
  async initPage() {
    this._calibrationRuns = RemoteData.loading();
    this.notify();

    const {result, ok} = await this._model.loader.get('/api/runs/calibration');
    this._calibrationRuns = ok ? RemoteData.success(result) : RemoteData.failure(result.message);

    this.notify();
  }

  /**
   * Send an HTTP POST request to trigger a new auto transitioning environment
   * @param {String} detector - for which the environment should be created
   * @param {String} runType - of the type of environment
   * @param {String} configurationName - name of the saved configuration to use
   * @return {void}
   */
  async newCalibrationRun(detector, runType, configurationName) {
    try {
      this._calibrationRuns.payload[detector][runType].ongoingCalibrationRun = RemoteData.loading();
      this.notify();

      const payload = {
        detector, runType, configurationName
      };
      const {result, ok} = await this._model.loader.post('/api/environment/auto', payload);

      this._calibrationRuns.payload[detector][runType].ongoingCalibrationRun =
        ok ? RemoteData.success(result) : RemoteData.failure(result.message);
      this.notify();
    } catch (error) {
      console.error('Unable to deploy environment due to ', error)
    }
  }

  /**
   * Getters & Setters
   */

  /**
   * Returns a RemoteData Object which wraps the reply of the server:
   * - a list of calibration runs grouped by detector
   * - an error message
   * @return {RemoteData<Object|Error>}
   */
  get calibrationRuns() {
    return this._calibrationRuns;
  }

  /**
   * Setter for updating the calibration runs object with a new RemoteData object
   * @param {RemoteData} remoteDataRuns - updated information
   * @return {void}
   */
  set calibrationRuns(remoteDataRuns) {
    this._calibrationRuns = remoteDataRuns;
  }
}
