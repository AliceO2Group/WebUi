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

import {Observable, RemoteData} from '/js/src/index.js';
import {PREFIX, VAR_TYPE} from './constants.js';
import FlpSelection from './panels/flps/FlpSelection.js';
import WorkflowVariable from './panels/variables/WorkflowVariable.js';
import WorkflowForm from './WorkflowForm.js';

/**
 * Model representing Workflow
 */
export default class Workflow extends Observable {
  /**
   * Initialize `list` to NotAsked
   * @param {Object} model
   */
  constructor(model) {
    super();
    this.model = model;
    this.flpSelection = new FlpSelection(this);
    this.flpSelection.bubbleTo(this);

    this.form = new WorkflowForm();
    this.form.bubbleTo(this);

    this.repoList = RemoteData.notAsked();
    this.revisions = [];
    this.templates = RemoteData.notAsked();

    this.refreshedRepositories = RemoteData.notAsked();

    this.revision = {
      isSelectionOpen: false,
      regex: new RegExp('master'),
      rawValue: 'master'
    };

    this.templatesVarsMap = {};
    this.selectedVarsMap = {};
    this.groupedPanels = {}

    this.READOUT_PREFIX = PREFIX.READOUT;

    this.QC_PREFIX = PREFIX.QC;

    this.dom = {
      keyInput: '',
      keyValueArea: ''
    }

    this.kvPairsString = ''; // variable stored for Adv Config Panel
  }

  /**
   * Initialize page and request data
   */
  async initWorkflowPage() {
    if (!this.form.isInputSelected()) {
      this.reloadDataForm();
    }
    this.flpSelection.setFLPListByRequest();
    this.resetErrorMessage();
  }

  /**
   * Method to update selected repository
   * @param {string} repository
   */
  setRepository(repository) {
    this.form.repository = repository;
    this.resetRevision(repository);
    this.setTemplatesData();
    this.form.setTemplate('');

    this.resetErrorMessage();

    this.notify();
  }

  /**
   * Reset `itemNew` to `NotAsked`
   */
  resetErrorMessage() {
    this.model.environment.itemNew = RemoteData.notAsked();
  }

  /**
   * Reset revision to repository default or global default
   * Update revisions list as well
   * @param {string} repository
   */
  resetRevision(repository) {
    let defaultRevision = this.repoList.payload.repos.filter((obj) => obj.name === repository)[0].defaultRevision;
    const globalDefault = this.repoList.payload.globalDefaultRevision;

    if (!defaultRevision && globalDefault) {
      defaultRevision = globalDefault;
    } else if (!defaultRevision && !globalDefault) {
      defaultRevision = 'master';
    }
    this.revision = {
      isSelectionOpen: false,
      regex: new RegExp(`^${defaultRevision}`),
      rawValue: defaultRevision
    };
    this.form.revision = defaultRevision;
    this.revisions = this.repoList.payload.repos.filter((obj) => obj.name === repository)[0].revisions;
    this.notify();
  }

  /**
   * Updates the selected revision with the new user selection
   * It will also make a request to core to request the public templates available for that (repository,revision)
   * @param {string} inputField - input that should be updated
   * @param {string} selectedRevision - Repository that user clicked on from the dropdown list
   */
  updateInputSelection(inputField, selectedRevision) {
    this.revision.isSelectionOpen = !this.revision.isSelectionOpen;
    this.form.template = '';
    this.form.revision = selectedRevision;
    this.setTemplatesData();
    this.updateInputSearch(inputField, selectedRevision);
  }

  /**
   * Method to update regex for filtering input dropdown values
   * @param {string} inputField - input that should be updated
   * @param {string} input - input from user used for autocomplete
   */
  updateInputSearch(inputField, input) {
    this.revision.regex = new RegExp(input);
    this.revision.rawValue = input;
    this.notify();
  }

  /**
   * Set the state of a dropdown (close/opened)
   * @param {boolean} option - true - open / false - close
   */
  setRevisionInputDropdownVisibility(option) {
    this.revision.isSelectionOpen = option;
    this.notify();
  }

  /**
   * Method to set to false the visibility of the dropdown and
   * if the user did not select a new revision from the dropdown area
   * to reset the value to the current selected revision
   */
  closeRevisionInputDropdown() {
    this.setRevisionInputDropdownVisibility(false);
    this.updateInputSearch('revision', this.form.revision);
  }

  /**
   * Match regex to see if revision is in a commit format
   * @return {boolean}
   */
  isInputCommitFormat() {
    const reg = new RegExp('[a-f0-9]{40}');
    return this.form.revision.match(reg);
  }

  /**
   * Method to check user's input and create a new environment
   */
  async createNewEnvironment() {
    const {ok, message, variables} = this.checkAndMergeVariables(this.form.variables, this.form.basicVariables);
    if (!ok) {
      // Check the user did not introduce items with the same key in Basic Configuration and Advanced Configuration
      this.model.environment.itemNew = RemoteData.failure(message);
    } else if (variables.hosts && variables.hosts.length > 0 && this.form.hosts.length > 0) {
      // Check FLP Selection is not duplicated in vars host
      this.model.environment.itemNew =
        RemoteData.failure('Selecting FLPs and adding an environment variable with key `hosts` is not possible');
    } else {
      variables['hosts'] = this.form.hosts.length > 0 ? JSON.stringify(this.form.hosts) : this.form.variables.hosts;
      if (!this.form.isInputSelected()) {
        this.model.environment.itemNew =
          RemoteData.failure('Please select repository, revision and workflow in order to create an environment');
      } else {
        let path = '';
        path = this.parseRepository(this.form.repository) + `/workflows/${this.form.template}@${this.form.revision}`;

        // Combine Readout URI if it was used
        this.model.environment.newEnvironment({workflowTemplate: path, vars: variables});
      }
    }
    this.notify();
  }

  /**
   * Request all templates for a specified commit and repository
   */
  requestCommitTemplates() {
    const options = {
      repoPattern: this.form.repository,
      revisionPattern: this.form.revision,
      allBranches: false,
      allTags: false
    };
    this.setTemplatesData(options);
  }

  /**
   * Method to check inputs of key and value
   * and add them to form of creating new environment
   * @param {string} key
   * @param {string} value
   * @return {boolean}
   */
  addVariable(key, value) {
    const isKeyCorrect = key && key.trim() !== '';
    const isValueCorrect = value && value.trim() !== '';
    if (isKeyCorrect && isValueCorrect) {
      key = key.trim();
      value = value.trim();
      if (!this.form.variables[key]) {
        this.form.variables[key] = value;
        this.notify();
        return true;
      } else {
        this.model.notification.show(`Key '${key}' already exists.`, 'danger', 2000);
      }
    } else {
      this.model.notification.show('Key and Value cannot be empty', 'danger', 2000);
    }
    return false;
  }

  /**
   * Given a JSON object, add each key and value to the panel of
   * KV pairs configuraiton
   * @param {String} kvPairs
   */
  addVariableList(kvPairs) {
    try {
      const pairs = JSON.parse(kvPairs);
      Object.keys(pairs).forEach((key) => this.addVariable(key, pairs[key]))
      this.kvPairsString = '';
    } catch (error) {
      this.model.notification.show('Provided string is not a valid JSON', 'danger', 3000);
    }
  }

  /**
   * Method to update the value of a (K;V) pair in variables
   * @param {string} key
   * @param {string} value
   */
  updateVariableValueByKey(key, value) {
    if (value && value.trim() !== '') {
      this.form.variables[key] = value;
      this.notify();
    } else {
      this.model.notification.show(`Value for '${key}' cannot be empty`, 'warning', 2000);
    }
  }

  /**
   * Method to update the value of a (K;V) pair in basicVariables
   * Checks if the type is a number; If it is, it will be converted to a string
   * @param {string} key
   * @param {object} value
   */
  updateBasicVariableByKey(key, value) {
    if (typeof value === 'number') {
      this.form.basicVariables[key] = JSON.stringify(value);
    } else {
      this.form.basicVariables[key] = value;
    }
    this.notify();
  }

  /**
   * After focus is taken from the input, the value added by the user will be trimmed
   * @param {string} key - key of the value that needs to be trimmed
   */
  trimVariableValue(key) {
    if (this.form.variables[key]) {
      this.form.variables[key] = this.form.variables[key].trim();
    }
    this.notify();
  }

  /**
   * Method to remove one of the variables by key
   * @param {string} key
   * @return {boolean}
   */
  removeVariableByKey(key) {
    if (this.form.variables[key]) {
      delete this.form.variables[key];
      this.notify();
      return true;
    } else {
      return false;
    }
  }

  /**
   * Generate the variables from spec map object if it exists
   * @param {String} template
   */
  generateVariablesSpec(template) {
    this.selectedVarsMap = {};
    this.form.basicVariables = {};
    this.groupedPanels = {};
    if (this.templatesVarsMap[template]
      && Object.keys(this.templatesVarsMap[template]).length > 0) {
      this.selectedVarsMap = this.templatesVarsMap[template];
      Object.keys(this.selectedVarsMap)
        .forEach((key) => {
          // Generate panels by grouping the variables by the `panel` field
          const variable = this.selectedVarsMap[key];
          const panelBelongingTo = variable.panel ? variable.panel : 'mainPanel';
          if (!this.groupedPanels[panelBelongingTo]) {
            this.groupedPanels[panelBelongingTo] = [];
          }
          variable.key = key;
          const workVariable = new WorkflowVariable(variable);
          this.groupedPanels[panelBelongingTo].push(workVariable);

          // add default values to selected basic variables form
          if (workVariable.defaultValue) {
            if (workVariable.type === VAR_TYPE.ARRAY) {
              this.updateBasicVariableByKey(key, [workVariable.defaultValue]);
            } else {
              this.updateBasicVariableByKey(key, workVariable.defaultValue);
            }
          }
        });
      Object.keys(this.groupedPanels)
        .forEach((key) => {
          // sort variables within each panel based on index and label
          let sortedVars = this.groupedPanels[key].sort((varA, varB) => {
            if (varA.index < varB.index) {
              return -1;
            } else if (varA.index > varB.index) {
              return 1;
            }
            return varA.label > varB.label ? 1 : -1
          });
          this.groupedPanels[key] = sortedVars;
        });
    }
  }

  /**
   * Method to make the necesarry requests to reload the data on the new environment page
   * * Make a request to retrieve a list of repositories with their corresponding revisions
   * * If above request is ok, make a request to get the public templates for the new updated (repository,revision)
   */
  async reloadDataForm() {
    await this.requestRepositoryList();
    if (this.repoList.isSuccess()) {
      this.setTemplatesData();
    }
  }
  /**
   * HTTP Requests
   */

  /**
   * Make a request to refresh repositories list from AliECS Core
   * If request is successful, make a new request with the updated repositories
   * Afterwards, request the public templates for the new updated (repository,revision)
   */
  async refreshRepositories() {
    this.refreshedRepositories = await this.remoteDataPostRequest(
      this.refreshedRepositories, `/api/RefreshRepos`, {index: -1}
    );
    if (this.refreshedRepositories.isSuccess()) {
      this.reloadDataForm();
    } else {
      this.model.notification.show(this.refreshedRepositories.payload, 'danger', 5000);
    }
  }

  /**
   * Load repositories into `repoList` as RemoteData
   * Set the selected repository the default one or the first one if default is missing
   * Set the revisions for the selected repository
   */
  async requestRepositoryList() {
    this.repoList = await this.remoteDataPostRequest(this.repoList, `/api/ListRepos`, {getRevisions: true});
    if (this.repoList.isSuccess()) {
      // Set first repository the default one or first from the list if default does not exist
      const repository = this.repoList.payload.repos.find((repository) => repository.default);
      if (repository) {
        this.form.repository = repository.name;
      } else if (this.repoList.payload.repos.length > 0) {
        this.form.repository = this.repoList.payload.repos[0].name;
      }
      this.notify();
      this.resetRevision(repository.name);
    }
  }

  /**
  * Load public templates for the selected repository and revision into RemoteData
  * @param {JSON} options
  */
  async setTemplatesData(options) {
    this.templates = RemoteData.loading();
    this.notify();

    if (!options) {
      options = {
        repoPattern: this.form.repository,
        revisionPattern: this.form.revision,
        allBranches: false,
        allTags: false
      };
    }
    const {result, ok} = await this.model.loader.post(`/api/GetWorkflowTemplates`, options);
    if (!ok) {
      this.templates = RemoteData.failure(result.message);
    } else {
      const templateList = [];
      result.workflowTemplates.map((templateObject) => {
        templateList.push(templateObject.template);
        if (templateObject.varSpecMap && Object.keys(templateObject.varSpecMap).length > 0) {
          this.templatesVarsMap[templateObject.template] = templateObject.varSpecMap;
        }
      })
      this.templates = RemoteData.success(templateList);
    }
    this.notify();
  }

  /**
   * Method to load a RemoteData object with data
   * @param {RemoteData} remoteDataItem - Item in which data will be loaded
   * @param {string} callString - API call as string
   * @param {JSON} options - options for the POST request
   */
  async remoteDataPostRequest(remoteDataItem, callString, options) {
    remoteDataItem = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(callString, options);
    if (!ok) {
      remoteDataItem = RemoteData.failure(result.message);
      this.notify();
      return remoteDataItem;
    } else {
      remoteDataItem = RemoteData.success(result);
      this.notify();
      return remoteDataItem;
    }
  }

  /**
   * Helpers
   */

  /**
   * Check that variables are not duplicated in basic and advanced 
   * configuration panel and merge them together
   * @param {JSON} vars
   * @param {JSON} basicVars
   * @return {boolean, string, JSON}
   */
  checkAndMergeVariables(vars, basicVars) {
    const variables = JSON.parse(JSON.stringify(vars));
    let basicVariables = JSON.parse(JSON.stringify(basicVars));
    const sameKeys = Object.keys(basicVariables).filter((key) => variables[key]);

    if (sameKeys.length > 0) {
      return {
        variables: {}, ok: false,
        message: `Due to Basic Configuration selection, you cannot use the following keys: ${sameKeys}`
      };
    } else {
      const readoutResult = this.parseReadoutURI(basicVariables);
      if (!readoutResult.ok) {
        return {ok: false, message: readoutResult.message, variables: {}};
      }
      basicVariables = readoutResult.variables;
      const qcResult = this.parseQcURI(basicVariables);
      if (!qcResult.ok) {
        return {ok: false, message: qcResult.message, variables: {}};
      }
      basicVariables = qcResult.variables;
      const allVariables = Object.assign({}, basicVariables, variables);
      return {ok: true, message: '', variables: allVariables};
    }
  }

  /**
   * Build the string for readout configuration URI
   * @param {JSON} vars
   * @return {JSON}
   */
  parseReadoutURI(vars) {
    if (vars['readout_cfg_uri'] && !vars['readout_cfg_uri_pre']) {
      return {
        variables: {}, ok: false,
        message: `Missing 'Readout URI' type selection`
      };
    } else if (!vars['readout_cfg_uri'] && vars['readout_cfg_uri_pre']) {
      return {
        variables: {}, ok: false,
        message: `Missing 'Readout URI' path. Either remove the type of the file or enter configuration path.`
      };
    } else if (vars['readout_cfg_uri'] && vars['readout_cfg_uri_pre']) {
      if (vars['readout_cfg_uri_pre'] === this.READOUT_PREFIX.CONSUL) {
        vars['readout_cfg_uri'] = this.flpSelection.consulReadoutPrefix + vars['readout_cfg_uri'];
      }
      vars['readout_cfg_uri'] = vars['readout_cfg_uri_pre'] + vars['readout_cfg_uri'];
      delete vars['readout_cfg_uri_pre'];
    }
    return {variables: vars, ok: true, message: ''};
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
   * Build the string for quality control configuration URI
   * @param {JSON} vars
   * @return {JSON}
   */
  parseQcURI(vars) {
    if (vars['qc_config_uri'] && !vars['qc_config_uri_pre']) {
      return {
        variables: {}, ok: false,
        message: `Missing 'QC URI' type selection`
      };
    } else if (!vars['qc_config_uri'] && vars['qc_config_uri_pre']) {
      return {
        variables: {}, ok: false,
        message: `Missing 'QC URI' path. Either remove the type of the file or enter configuration path.`
      };
    } else if (vars['qc_config_uri'] && vars['qc_config_uri_pre']) {
      if (vars['qc_config_uri_pre'] === this.QC_PREFIX.CONSUL) {
        vars['qc_config_uri'] = this.flpSelection.consulQcPrefix + vars['qc_config_uri'];
      }
      vars['qc_config_uri'] = vars['qc_config_uri_pre'] + vars['qc_config_uri'];
      delete vars['qc_config_uri_pre'];
    }
    return {variables: vars, ok: true, message: ''};
  }
}
