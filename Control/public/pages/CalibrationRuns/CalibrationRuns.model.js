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
     *    {<RunSummary>},
     *    {<RunSummary>}
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
