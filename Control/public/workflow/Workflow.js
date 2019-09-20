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
    this.map = RemoteData.notAsked();

    this.repository = {
      isSelectionOpen: false,
      regex: new RegExp(),
      selected: ''
    };
    this.revision = {
      isSelectionOpen: false,
      regex: new RegExp(),
      selected: ''
    };
    this.template = {
      isSelectionOpen: false,
      regex: new RegExp(),
      selected: ''
    };
  }

  /**
   * Updates the selected repository with the new user selection
   * @param {string} inputField
   * @param {string} selectedRepo
   */
  updateRepositorySelection(inputField, selectedRepo) {
    switch (inputField) {
      case 'repository':
        this.repository.regex = new RegExp('^' + selectedRepo);
        this.repository.selected = selectedRepo;
        this.repository.isSelectionOpen = !this.repository.isSelectionOpen;
        break;
    }
    // this.toggleInputDropdown(inputField);
  }

  /**
   * Method to update regex for filtering input dropdown values
   * @param {string} inputField
   * @param {string} input
   */
  updateInputSearch(inputField, input) {
    switch (inputField) {
      case 'repository':
        this.repository.regex = new RegExp('^' + input);
        this.repository.selected = input;
        break;
    }
    this.notify();
  }

  /**
   * Toggle if an input dropdown should be opened or closed
   * @param {JSON} inputField
   * @param {boolean} option
   */
  setInputDropdownVisibility(inputField, option) {
    switch (inputField) {
      case 'repository':
        this.repository.isSelectionOpen = option;
        break;
    }
    this.notify();
  }

  /**
   * Load repositories into `repoList` as RemoteData
   */
  async getRepositoriesList() {
    this.repoList = await this.remoteDataPostRequest(this.repoList, `/api/ListRepos`, {});
    if (this.repoList.isSuccess()) {
      this.repository.selected = this.repoList.payload.repos.find((repository) => repository.default).name;
      this.repository.regex = new RegExp('^' + this.repository.selected);
    }
    this.getAsMap();
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////
  /**
   * Load workflows into `list` as RemoteData
   */
  async get() {
    this.list = await this.remoteDataPostRequest(this.repoList, `/api/GetWorkflowTemplates`, {});
  }

  /**
  * Load workflows into `map` as RemoteData
  * @param {boolean} getAll
  */
  async getAsMap(getAll) {
    let options = {
      repoPattern: '',
      revisionPattern: '',
      allBranches: false,
      allTags: false
    };
    this.map = RemoteData.loading();
    this.notify();
    if (getAll) {
      this.viewAll = true;
      options = {
        repoPattern: '*',
        revisionPattern: '*',
        allBranches: true,
        allTags: true
      };
    }

    //* add options
    const {result, ok} = await this.model.loader.post(`/api/GetWorkflowTemplates`, options);
    if (!ok) {
      this.map = RemoteData.failure(result.message);
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
    this.map = RemoteData.success(map);

    this.notify();
  }

  /**
   * fdsa
   * @param {string} field
   * @param {string} reg
   */
  update(field, reg) {
    switch (field) {
      case 'input':
        if (reg) {
          this.inputReg = new RegExp('^' + reg);
        } else {
          this.inputReg = new RegExp('');
        }
        break;
      case 'revision':
        if (reg) {
          this.revisionReg = new RegExp('^' + reg);
        } else {
          this.revisionReg = new RegExp('');
        }
        break;
      case 'template':
        if (reg) {
          this.templateReg = new RegExp('^' + reg);
        } else {
          this.templateReg = new RegExp('');
        }
        break;
    }
    this.notify();
  }

  /**
   * Close all dropdowns
   */
  hideAllDropdowns() {
    console.log("CHEMAT")
    this.repository.isSelectionOpen = false;
    this.revision.isSelectionOpen = false;
    this.template.isSelectionOpen = false;
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
