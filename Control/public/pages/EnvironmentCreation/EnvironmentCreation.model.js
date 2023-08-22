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
import {jsonFetch} from '../../utilities/jsonFetch.js';

/**
 * Model to store the state of the simplified environment creation page
 */
export class EnvironmentCreationModel extends Observable {
  /**
   * Constructor
   * @param {Model} model - the global model
   */
  constructor(model) {
    super();

    this._creationModel = null;
    /**
     * @type {Model}
     */
    this._model = model;

    this._currentWorkflow = RemoteData.notAsked();
  }

  /**
   * Initialize model for environment creation page
   */
  initPage() {
    this._currentWorkflow = RemoteData.loading();
    this.notify();
    jsonFetch('/api/workflow/template/default/source', {method: 'GET'})
      .then((data) => {
        this._currentWorkflow = RemoteData.success(data);
        this.notify();
      })
      .catch((error) => {
        this._currentWorkflow = RemoteData.failure(error);
        this.notify();
      });
  }

  /**
     * Returns the creation model
     *
     * @return {EnvironmentCreationModel|null} the creation model
     */
  get creationModel() {
    return this._creationModel;
  }

  /**
   * Getter for returning an instance of the current workflow remote data object
   * @returns {RemoteData}
   */
  get currentWorkflow() {
    return this._currentWorkflow;
  }
}
