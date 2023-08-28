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
    
    this._services = model.services;
    this._detectorsAvailability = RemoteData.notAsked();

  }

  /**
   * Initialize model for environment creation page
   */
  async initPage() {
    this._defaultWorkflow = RemoteData.loading();
    this._workflowMappings = RemoteData.loading();
    this._detectorsAvailability = RemoteData.loading();
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

    this._detectorsAvailability = await this._services.detectors.getDetectorsAvailabilityAsRemote(true);
    this.notify();
  }

  /**
   * Check for selected user input and if ok, trigger action to deploy environment based on given configuration
   * @param {String} configuration - selected configuration to deploy environment
   * @returns {void}
   */
  async deployEnvironment(configuration) {
    console.log('configuration selected', configuration)
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
   * Getter for retrieving information on the detectors state
   * @returns {RemoteData<Array<DetectorAvailability>>} - list of detectors state
   */
  get detectorsAvailability(){
    return this._detectorsAvailability;
  }

  /**
   * Getter for returning an instance of the current detectors as per AliECS
   * @returns {RemoteData<Array<String>>} - list of detectors name
   */
  get detectorsList() {
    return this._detectorsList;
  }
  
}
