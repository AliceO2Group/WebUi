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
    this.list = RemoteData.notAsked();
    this.templatesMap = RemoteData.notAsked();

    this.revision = {
      isSelectionOpen: false,
      regex: new RegExp(),
      selected: ''
    };

    this.form = {
      repository: '',
      revision: '',
      template: ''
    };
  }

  /**
   * Method to update selected repository
   * @param {string} repository
   */
  setRepository(repository) {
    this.form.repository = repository;
    this.resetRevision();
    this.notify();
  }

  /**
   * Set template selected by the user from the list
   * @param {string} template
   */
  setTemplate(template) {
    this.form.template = template;
    this.notify;
  }

  /**
   * Reset revision when user selects a different repository
   */
  resetRevision() {
    this.revision = {
      isSelectionOpen: false,
      regex: new RegExp(),
      selected: ''
    };
    this.notify();
  }
  /**
   * Updates the selected repository with the new user selection
   * @param {string} inputField - input that should be updated
   * @param {string} selectedRepo - Repository that user clicked on from the dropdown list
   */
  updateInputSelection(inputField, selectedRepo) {
    this.revision.isSelectionOpen = !this.revision.isSelectionOpen;
    this.form.template = '';
    this.updateInputSearch(inputField, selectedRepo);
  }

  /**
   * Returns true/false if revision selected by the user is a commit or exists
   * @return {boolean}
   */
  isRevisionCorrect() {
    return this.templatesMap.isSuccess()
      && this.templatesMap.payload[this.form.repository]
      && this.templatesMap.payload[this.form.repository][this.revision.selected]
      && !this.revision.selected.startsWith('#');
  }

  /**
   * Method to update regex for filtering input dropdown values
   * @param {string} inputField - input that should be updated
   * @param {string} input - input from user used for autocomplete
   */
  updateInputSearch(inputField, input) {
    if (input === '#') {
      this.revision.isSelectionOpen = false;
    }
    this.revision.regex = new RegExp('^' + input);
    this.revision.selected = input;
    this.form.revision = input;
    this.notify();
  }

  /**
   * Set the state of a dropdown (close/opened)
   * @param {JSON} inputField - dropdown that should change state
   * @param {boolean} option - true - open / false - close
   */
  setInputDropdownVisibility(inputField, option) {
    // true la una false la celelalte÷
    // maybe add arrows & enter commands to input
    switch (inputField) {
      case 'revision':
        this.revision.isSelectionOpen = option;
        break;
    }
    this.notify();
  }

  /**
   * Method to close all dropdowns if users focuses on different part of screen
   */
  closeAllDropdowns() {
    this.revision.isSelectionOpen = false;
    this.notify();
  }

  /**
   * Method to check that all mandatory fields were filled
   * @return {boolean}
   */
  isInputSelected() {
    return this.form.repository !== ''
      && this.form.revision !== ''
      && (this.form.revision.startsWith('#') || this.form.template !== '');
  }

  /**
   * Method to check user's input and create a new environment
   */
  async createNewEnvironment() {
    const templates = this.templatesMap.payload;
    const repository = this.form.repository;
    if (!templates[repository]) {
      this.model.environment.itemNew = RemoteData.failure('Selected repository does not exist');
    } else {
      const revision = this.form.revision;
      if (revision.startsWith('#')) {
        const path = templates + '/' + revision;
        // this.model.environment.newEnvironment(path);
      } else if (!templates[repository][revision]) {
        this.model.environment.itemNew = RemoteData.failure('Selected revision does not exist for this repository');
      } else {
        const template = this.form.template;
        if (template !== '') {
          const path = repository + 'workflows/' + template + '@' + revision;
          this.model.environment.newEnvironment({workflowTemplate: path});
        } else {
          this.model.environment.itemNew =
            RemoteData.failure('Selected template does not exist for this repository & revision');
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
      revisionPattern: this.form.revision.substring(1),
      allBranches: false,
      allTags: false
    };
    this.getAllTemplatesAsMap(options);
  }

  /**
   * HTTP Requests
   */

  /**
   * Load workflows into `list` as RemoteData
   */
  async get() {
    this.list = await this.remoteDataPostRequest(this.repoList, `/api/GetWorkflowTemplates`, {});
  }

  /**
   * Load repositories into `repoList` as RemoteData
   */
  async getRepositoriesList() {
    this.repoList = await this.remoteDataPostRequest(this.repoList, `/api/ListRepos`, {});
    if (this.repoList.isSuccess()) {
      this.form.repository = this.repoList.payload.repos.find((repository) => repository.default).name;
    }
  }

  /**
  * Load all templates from all repositoris & all revisions into `map` as RemoteData
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
    this.templatesMap = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/GetWorkflowTemplates`, options);
    if (!ok) {
      this.templatesMap = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    const map = {};
    Object.values(result.workflowTemplates).forEach((element) => {
      const existRepo = map[element.repo];
      if (existRepo) {
        const existRevision = map[element.repo][element.revision];
        if (existRevision) {
          const ar = map[element.repo][element.revision];
          ar.push(element.template);
          map[element.repo][element.revision] = ar;
        } else {
          map[element.repo][element.revision] = [element.template];
        }
      } else {
        map[element.repo] = {};
        map[element.repo][element.revision] = [element.template];
      }
    });

    if (!this.templatesMap.isNotAsked()) {
      Object.keys(map).forEach((key) => {
        Object.keys(map[key]).forEach((secondKey) => {
          map[key]['#' + secondKey] = map[key][secondKey];
          delete map[key][secondKey];
        });
      });
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
}
