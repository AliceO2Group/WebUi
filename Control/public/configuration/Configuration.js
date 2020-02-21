import {Observable, RemoteData} from '/js/src/index.js';

/**
 * Model representing Configuration CRUD
 */
export default class Configuration extends Observable {
  /**
   * Initialize all ajax calls to "NotAsked" type
   * @param {Observable} model
   */
  constructor(model) {
    super();

    this.model = model;
    this.actionPanel = {
      command: 'CONFIG',
      expertMode: false,
      expertOptions: this.getDefaultExpertOptions()
    };
    this.rocStatus = RemoteData.notAsked();
    this.cruList = RemoteData.notAsked();
  }

  /**
   * Change command chosen by user
   * @param {string} command
   */
  setCommand(command) {
    this.actionPanel.command = command;
    this.notify();
  }

  /**
   * Toggle the Expert Panel for overriding defaults before running roc command
   */
  toggleExpertPanel() {
    this.actionPanel.expertMode = !this.actionPanel.expertMode;
    this.notify();
  }

  /**
   * Check/Uncheck the selection of a CRU
   * @param {string} hostName
   * @param {string} card
   */
  toggleCRUSelection(hostName, card) {
    this.cruList.payload[hostName].objects[card].checked = !this.cruList.payload[hostName].objects[card].checked;
    this.notify();
  }

  /**
   * Check/Uncheck all CRUs under one host
   * @param {string} hostName
   */
  toggleAllCRUsForHost(hostName) {
    const toggleValue = !this.areAllCRUsForHostSelected(hostName);
    const hosts = this.cruList.payload[hostName].objects;
    Object.keys(hosts).forEach((index) => hosts[index].checked = toggleValue);
    this.notify();
  }

  /**
   * Check if all CRUs of a host are selected
   * @param {string} hostName
   * @return {boolean}
   */
  areAllCRUsForHostSelected(hostName) {
    const hosts = this.cruList.payload[hostName].objects;
    return 0 === Object.keys(hosts).filter((index) => hosts[index].checked === false).length;
  }

  /**
   * Toggle visibility of the CRUs belonging to the host
   * @param {string} hostName
   */
  toggleHostRow(hostName) {
    this.cruList.payload[hostName].open = !this.cruList.payload[hostName].open;
    this.notify();
  }

  /**
   * Method to reset all CRUs to an unselected state and hosts to an opened state
   * @param {Map<string, Map<string, string>>} crusByHost
   * @return {Map<string, Map<string, string>>}
   */
  uncheckAllCRUs(crusByHost) {
    Object.keys(crusByHost).forEach((hostName) => {
      const objects = crusByHost[hostName];
      crusByHost[hostName] = {};
      crusByHost[hostName].objects = objects;
      crusByHost[hostName].open = true;
      Object.keys(crusByHost[hostName].objects).forEach((index) => crusByHost[hostName].objects[index].checked = false);
    });
    return crusByHost;
  }

  /**
   * Method to set the value of a field within the expert panel
   * @param {String} field
   * @param {String} value
   */
  setExpertOptionByField(field, value) {
    if (this.isFieldOfTypeBoolean(field)) {
      this.actionPanel.expertOptions[field] = (value === 'TRUE');
    } else if (this.isFieldOfTypeUnsignedInteger(field, value)) {
      this.actionPanel.expertOptions[field] = value;
    } else if (this.isFieldOfTypeString(field)) {

      this.actionPanel.expertOptions[field] = value;
    }
    this.notify();
  }

  /**
   * Method to toggle selection of a link
   * @param {number} index
   */
  toggleLinkSelection(index) {
    this.actionPanel.expertOptions.links[index] = !this.actionPanel.expertOptions.links[index];
  }

  /**
   * Method to build the request for AliECS - core and send it
   */
  confirmSelectionAndRunCommand() {
    const rocOptions = {};
    const request = this.actionPanel.expertOptions;
    Object.entries(request).forEach(([key, value]) => {
      if (key === 'links') {
        //
      } else if (value !== null && value !== '') {
        rocOptions[key] = value;
      }
    });
    this.executeCommand(rocOptions);
  }
  /*
   * Helpers=
   */

  /**
   * Method to initialize with defaults all expert options
   * @return {JSON}
   */
  getDefaultExpertOptions() {
    return {
      cruId: '',
      clock: '',
      dataPathMode: '',
      downStreamData: '',
      gbtMode: '',
      gbtMux: '',
      links: Array(12).fill(false),
      allowRejection: null, // bool
      loopback: null, // bool
      ponUpstream: null, // bool
      dynOffset: null, // bool
      forceConfig: null, // bool
      onuAddress: null, // [0, 2^32 - 1]
      triggerWindowSize: null // [0, 4095]
    };
  }

  /**
   * Method to check if values are in expected format and ca be assigned to a boolean type
   * @param {string} field
   * @return {boolean}
   */
  isFieldOfTypeBoolean(field) {
    return ['allowRejection', 'loopback', 'ponUpstream', 'dynOffset'].includes(field);
  }

  /**
   * Method to check that the field is expecting an uint32_t and that the value respects the criteria
   * @param {String} field
   * @param {String} value
   * @return {boolean}
   */
  isFieldOfTypeUnsignedInteger(field, value) {
    let isValueCorrect = Number.isInteger(value) && value >= 0 && value <= (Math.pow(2, 32) - 1);
    const isFieldCorrect = ['onuAddress', 'triggerWindowSize'];
    if (field === 'triggerWindowSize' && value > 4095) {
      isValueCorrect = false;
    }
    return isValueCorrect && isFieldCorrect;
  }

  /**
   * Method to check if provided field is part of the ones accepting a string value
   * @param {string} field
   * @return {boolean}
   */
  isFieldOfTypeString(field) {
    return ['cruId', 'clock', 'dataPathMode', 'downStreamData', 'gbtMode', 'gbtMux'].includes(field);
  }

  /**
   *  HTTP Requests
   */

  /**
   * Method to retrieve a list of CRUs from Consul
   */
  async getCRUList() {
    this.cruList = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.get(`/api/getCRUs`);
    if (!ok) {
      this.cruList = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.cruList = RemoteData.success(this.uncheckAllCRUs(result));
    this.notify();
  }

  /**
   * Method to execute a ROC command through AliECS - Core
   * @param {JSON} rocOptions
   */
  async executeCommand(rocOptions) {
    this.rocStatus = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/executeRocCommand`);
    if (!ok) {
      this.rocStatus = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.rocStatus = RemoteData.success(result);
    this.notify();
  }
}
