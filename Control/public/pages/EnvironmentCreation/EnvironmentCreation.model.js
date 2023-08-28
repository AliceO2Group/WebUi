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
import WorkflowForm from '../../workflow/WorkflowForm.js';

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

    this._creationModel = new WorkflowForm();

    /**
     * @type {Model}
     */
    this._model = model;

    /**
     * Default workflow metadata information as set by AliECS (repository, revision, template)
     */
    this._defaultWorkflow = RemoteData.notAsked();

    /**
     * Workflow Mappings (label, configuration) stored for deployment;
     */
    this._workflowMappings = RemoteData.notAsked();

    /**
     * Saved Configuration retrieved for selected workflow from the mappings
     */
    this._workflowLoaded = RemoteData.notAsked();

    this._selectedConfigurationLabel = '';

    this._isReady = false;
  }

  /**
   * Initialize model for environment creation page
   */
  async initPage() {
    this._model.workflow.initWorkflowPage();

    this._defaultWorkflow = RemoteData.loading();
    this._workflowMappings = RemoteData.loading();
    this.notify();

    const {result: mappingResult, ok: isMappingOk} = await this._model.loader.get('/api/workflow/template/mappings');
    this._workflowMappings = isMappingOk
      ? RemoteData.success(mappingResult) : RemoteData.failure(mappingResult.message);

    const {result: workflowResult, ok} = await this._model.loader.get('/api/workflow/template/default/source');
    if (ok) {
      this._defaultWorkflow = RemoteData.success(workflowResult);
      this._creationModel.setTemplateInfo(workflowResult);
    } else {
      this._defaultWorkflow = RemoteData.failure(workflowResult.message);
      this._creationModel = new WorkflowForm();
    }

    this.notify();
  }

  /**
   * Check for selected user input and if ok, trigger action to deploy environment based on given configuration
   * @returns {void}
   */
  async deployEnvironment() {
    this._creationModel.variables.hosts = JSON.stringify(this._model.workflow.form.hosts);
    const path = this.parseRepository(this._creationModel.repository)
      + `/workflows/${this._creationModel.template}@${this._creationModel.revision}`;

    this._model.environment.newEnvironment({
      workflowTemplate: path,
      vars: this._creationModel.variables,
      detectors: this._model.workflow.flpSelection.selectedDetectors
    });
  }

  /**
   * Ensure there is no slash at the end of the workflow URL
   * @param {String} url
   * @return {String}
   */
  parseRepository(url) {
    const copy = url.slice();
    if (copy[copy.length - 1] === '/') {
      return copy.slice(0, -1)
    } else {
      return copy;
    }
  }

  /**
   * Attempts to retrieve configuration for selected workflow template.
   * If unable to load it, the Workflow form variables are reset
   */
  async setCreationModelConfiguration(configuration) {
    this._workflowLoaded = RemoteData.loading();
    this.notify();

    const {result, ok} = await this._model.loader.get('/api/workflow/configuration', {name: configuration});
    if (ok) {
      this._workflowLoaded = RemoteData.success(result);
      this._selectedConfigurationLabel = configuration;
      this._creationModel.variables = result.variables;
    } else {
      this._workflowLoaded = RemoteData.failure(result.message);
      this._selectedConfigurationLabel = '';
      this._creationModel.variables = {};
    }
    this.notify();
  }

  /**
   * Set the number of EPNs that are to be used
   * @param {Number} nEpns
   */
  setOdcNumberOfEpns(numberOfEpns) {
    if (!isNaN(numberOfEpns)) {
      this._creationModel.variables['odc_n_epns'] = numberOfEpns;
    }
  }

  /**
   * Returns the creation model that is to be passed to AliECS for deployment
   *
   * @return {WorkflowForm} the creation model
   */
  get creationModel() {
    return this._creationModel;
  }
  /**
   * Getter for returning an instance of the current workflow remote data object
   * @return {RemoteData}
   */
  get defaultWorkflow() {
    return this._defaultWorkflow;
  }

  /**
   * Getter for returning a list of environment creation mappings if they exist
   * @return {<Array<{label:String, configuration:String}>}
   */
  get workflowMappings() {
    return this._workflowMappings;
  }

  /**
   * Return the loaded configuration RemoteData object
   * @return {RemoteData}
   */
  get workflowLoaded() {
    return this._workflowLoaded;
  }

  /**
   * Return the label of the configuration selected by the user
   * @return {String} - selected configuration label
   */
  get selectedConfigurationLabel() {
    return this._selectedConfigurationLabel;
  }

  /**
   * Check if the environment configuration is ready to be deployed
   * @return {boolean}
   */
  get isReady() {
    const isLabelSelected = Boolean(this._selectedConfigurationLabel);
    const areHostsSelected = this._model.workflow.form.hosts?.length > 0;
    const areEpnsCounted = !isNaN(this._creationModel.variables['odc_n_epns']);
    return isLabelSelected && areHostsSelected && areEpnsCounted;
  }

}
