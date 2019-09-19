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
    this.list = RemoteData.notAsked();
    this.map = RemoteData.notAsked();
    this.viewAll = false;
    this.inputReg = new RegExp('');
    this.revisionReg = new RegExp('');
    this.templateReg = new RegExp('');
  }

  /**
   * Load workflows into `list` as RemoteData
   */
  async get() {
    this.list = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/GetWorkflowTemplates`);
    if (!ok) {
      this.list = RemoteData.failure(result.message);
      this.notify();
      return;
    }

    this.list = RemoteData.success(result);
    this.getAsMap();
    this.notify();
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
}
