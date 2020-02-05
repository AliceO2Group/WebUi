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
      command: 'STATUS',
      expertMode: false,
      expertOptions: this.getDefaultExpertOptions()
    };
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

  /*
   * Helpers
   */

  /**
   * Method to initialize with defaults all expert options
   * @return {JSON}
   */
  getDefaultExpertOptions() {
    return {
      allowRejection: false,
      cruId: '',
      clock: '',
      dataPathMode: '',
      downStreamData: '',
      gbtMode: '',
      gbtMux: '',
      links: Array(12).fill(false),
      loopback: false,
      ponUpstream: false,
      dynOffset: false,
      onuAddress: '',
      triggerWindowSize: 1000
    };
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
}
