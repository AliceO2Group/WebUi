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

    this.repoList = RemoteData.notAsked();
    this.refreshedRepositories = RemoteData.notAsked();
    this.templatesMap = RemoteData.notAsked();

    this.revision = {
      isSelectionOpen: false,
      regex: new RegExp('master'),
      rawValue: 'master'
    };

    this.form = {
      repository: '',
      revision: 'master',
      template: '',
      variables: {},
      basicVariables: {},
      hosts: []
    };

    this.flpList = RemoteData.notAsked();
  }

  /**
   * Initialize page and request data
   */
  initWorkflowPage() {
    if (!this.form.repository && !this.form.template) {
      this.getRepositoriesList();
      this.getAllTemplatesAsMap();
      this.getFLPList();
    }

    this.resetErrorMessage();
  }

  /**
   * Method to update selected repository
   * @param {string} repository
   */
  setRepository(repository) {
    this.form.repository = repository;
    this.resetErrorMessage();
    this.setTemplate('');
    this.resetRevision(repository);
    this.notify();
  }

  /**
   * Set template selected by the user from the list
   * @param {string} template
   */
  setTemplate(template) {
    this.form.template = template;
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
    this.notify();
  }

  /**
   * Method to return current selected revision
   * @return {string}
   */
  getRevision() {
    return this.form.revision;
  }

  /**
   * Updates the selected repository with the new user selection
   * @param {string} inputField - input that should be updated
   * @param {string} selectedRevision - Repository that user clicked on from the dropdown list
   */
  updateInputSelection(inputField, selectedRevision) {
    this.revision.isSelectionOpen = !this.revision.isSelectionOpen;
    this.form.template = '';
    this.form.revision = selectedRevision;
    this.updateInputSearch(inputField, selectedRevision);
  }

  /**
   * Returns true/false if revision selected by the user exists
   * @return {boolean}
   */
  isRevisionCorrect() {
    return this.templatesMap.isSuccess()
      && this.templatesMap.payload[this.form.repository]
      && this.templatesMap.payload[this.form.repository][this.form.revision];
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
   * Match regex to see if revision is in a commit format
   * @return {boolean}
   */
  isInputCommitFormat() {
    const reg = new RegExp('[a-f0-9]{40}');
    return this.form.revision.match(reg);
  }

  /**
   * Method to check that all mandatory fields were filled
   * @return {boolean}
   */
  isInputSelected() {
    return this.form.repository.trim() !== ''
      && this.form.revision.trim() !== ''
      && this.form.template.trim() !== '';
  }

  /**
   * Method to check user's input and create a new environment
   */
  async createNewEnvironment() {
    const templates = this.templatesMap.payload;
    const repository = this.form.repository;
    const variables = JSON.parse(JSON.stringify(this.form.variables));
    const sameKeys = Object.keys(this.form.basicVariables).filter((key) => this.form.variables[key]);
    // Check the user did not introduce items with the same key in Basic Configuration and Advanced Configuration
    if (sameKeys.length !== 0) {
      this.model.environment.itemNew =
        RemoteData.failure(`Due to Basic Configuration selection, you cannot use the following keys: ${sameKeys}`);
    } else if (this.form.variables.hosts && this.form.variables.hosts.length > 0 && this.form.hosts.length > 0) {
      // Check FLP Selection is not duplicated in vars host
      this.model.environment.itemNew =
        RemoteData.failure('Selecting FLPs and adding an environment variable with key `hosts` is not possible');
    } else {
      variables['hosts'] = this.form.hosts.length > 0 ? JSON.stringify(this.form.hosts) : this.form.variables.hosts;
      if (!templates[repository]) {
        this.model.environment.itemNew = RemoteData.failure('Selected repository does not exist');
      } else {
        const revision = this.form.revision;
        if (!templates[repository][revision]) {
          this.model.environment.itemNew = RemoteData.failure('Selected revision does not exist for this repository');
        } else {
          const template = this.form.template;
          if (template !== '') {
            let path = '';
            if (revision === '(no-revision-by-default)') {
              path = repository + 'workflows/' + template;
            } else {
              path = repository + 'workflows/' + template + '@' + revision;
            }
            const finalVariables = Object.assign({}, this.form.basicVariables, variables);
            this.model.environment.newEnvironment({workflowTemplate: path, vars: finalVariables});
          } else {
            this.model.environment.itemNew =
              RemoteData.failure('Selected template does not exist for this repository & revision');
          }
        }
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
    this.getAllTemplatesAsMap(options);
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
   * @param {string} key
   * @param {string} value
   */
  updateBasicVariableByKey(key, value) {
    this.form.basicVariables[key] = value;
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
   * Toggle the selection of an FLP from the form host
   * @param {string} name
   */
  toggleFLPSelection(name) {
    const index = this.form.hosts.indexOf(name);
    if (index < 0) {
      this.form.hosts.push(name);
    } else {
      this.form.hosts.splice(index, 1);
    }
    this.notify();
  }

  /**
   * HTTP Requests
   */

  /**
   * Request to refresh repositories list from AliECS Core
   */
  async refreshRepositories() {
    this.refreshedRepositories = await this.remoteDataPostRequest(this.refreshedRepositories, `/api/RefreshRepos`, {});
    if (this.refreshedRepositories.isSuccess()) {
      this.getRepositoriesList();
      this.getAllTemplatesAsMap();
    } else {
      this.model.notification.show(this.refreshedRepositories.payload, 'danger', 5000);
    }
  }

  /**
   * Load repositories into `repoList` as RemoteData
   */
  async getRepositoriesList() {
    this.repoList = await this.remoteDataPostRequest(this.repoList, `/api/ListRepos`, {});
    if (this.repoList.isSuccess()) {
      // Set first repository the default one or first from the list if default does not exist
      const repository = this.repoList.payload.repos.find((repository) => repository.default);
      if (repository) {
        this.form.repository = repository.name;
      } else if (this.repoList.payload.repos.length > 0) {
        this.form.repository = this.repoList.payload.repos[0].name;
      }
      const initRepo = this.repoList.payload.repos[0].name;
      this.resetRevision(initRepo);
    }
  }

  /**
  * Load all templates from all repositories & all revisions into `map` as RemoteData
  * @param {JSON} options
  */
  async getAllTemplatesAsMap(options) {
    if (!options) {
      options = {
        repoPattern: '*',
        revisionPattern: '*',
        allBranches: false,
        allTags: false
      };
    }
    const tempMap = this.templatesMap.payload;
    this.templatesMap = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/GetWorkflowTemplates`, options);
    if (!ok) {
      this.templatesMap = RemoteData.failure(result.message);
      this.notify();
      return;
    }

    let map = this.getMapFromList(result);
    if (tempMap) {
      map = this.mergeMaps(map, tempMap);
      this.templatesMap = RemoteData.success(map);
    } else {
      this.templatesMap = RemoteData.success(map);
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
   * Method to retrieve a list of FLPs
   */
  async getFLPList() {
    this.flpList = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.get(`/api/getFLPs`);
    if (!ok) {
      this.flpList = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.flpList = RemoteData.success(result);
    // preselect all hosts once they are loaded
    this.form.hosts = Object.values(result);
    this.notify();
  }
  /**
   * Helpers
   */

  /**
   * Group list of repository in a JSON object by
   * repository and revision as keys
   * @param {Array<JSON>} list
   * @return {JSON}
   */
  getMapFromList(list) {
    const map = {};
    Object.values(list.workflowTemplates).forEach((element) => {
      if (!element.revision) {
        element.revision = '(no-revision-by-default)';
      }
      if (map[element.repo]) {
        if (map[element.repo][element.revision]) {
          const templates = map[element.repo][element.revision];
          templates.push(element.template);
          map[element.repo][element.revision] = templates;
        } else {
          map[element.repo][element.revision] = [element.template];
        }
      } else {
        map[element.repo] = {};
        map[element.repo][element.revision] = [element.template];
      }
    });
    return map;
  }

  /**
   * Method to merge 2 maps
   * @param {JSON} map
   * @param {JSON} tempMap
   * @return {JSON}
   */
  mergeMaps(map, tempMap) {
    Object.keys(tempMap).forEach((tempKey) => {
      Object.keys(map).filter((key) => key === tempKey).forEach((key) => {
        Object.keys(tempMap[key]).forEach((revisionKey) => {
          map[key][revisionKey] = tempMap[key][revisionKey];
        });
      });
    });
    return map;
  }
}
