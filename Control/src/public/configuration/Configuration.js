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
 * Model representing Configuration CRUD
 * @deprecated
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
      runButtonDisabled: false,
      expertMode: false,
      expertOptions: this.getDefaultExpertOptions()
    };
    this.rocStatus = RemoteData.notAsked();
    this.readoutCardList = RemoteData.notAsked();
  }

  /**
   * Change command chosen by user from dropdown
   * @param {string} command
   */
  setRocCommand(command) {
    this.actionPanel.command = command;
    this.notify();
  }

  /**
   * Toggle the Expert Panel for overriding defaults before running roc config command
   */
  toggleExpertPanel() {
    this.actionPanel.expertMode = !this.actionPanel.expertMode;
    this.notify();
  }

  /**
   * Select/Deselect a readout card by hostname and card
   * @param {string} hostName
   * @param {string} card
   */
  toggleReadoutCardSelection(hostName, card) {
    this.readoutCardList.payload[hostName].objects[card].checked =
      !this.readoutCardList.payload[hostName].objects[card].checked;
    this.notify();
  }

  /**
   * Select/Deselect all readout cards under a specified hostname
   * @param {string} hostName
   */
  toggleAllReadoutCardsByHost(hostName) {
    const toggleValue = !this.areAllReadoutCardsForHostSelected(hostName);
    const hosts = this.readoutCardList.payload[hostName].objects;
    Object.keys(hosts).forEach((index) => hosts[index].checked = toggleValue);
    this.notify();
  }

  /**
   * Check if all ReadoutCards under a host are selected
   * @param {string} hostName
   * @return {boolean}
   */
  areAllReadoutCardsForHostSelected(hostName) {
    const hosts = this.readoutCardList.payload[hostName].objects;
    return 0 === Object.keys(hosts).filter((index) => !hosts[index].checked).length;
  }

  /**
   * Toggle visibility of the ReadoutCards belonging to the host
   * @param {string} hostName
   */
  toggleHostRow(hostName) {
    this.readoutCardList.payload[hostName].open = !this.readoutCardList.payload[hostName].open;
    this.notify();
  }

  /**
   * Toggle visibility of the ReadoutCards belonging to the host
   */
  toggleAllHostRows() {
    const areAllHostRowsOpened = this.areAllHostRowsOpened();
    Object.keys(this.readoutCardList.payload)
      .forEach((hostName) => this.readoutCardList.payload[hostName].open = !areAllHostRowsOpened);
    this.notify();
  }

  /**
   * Method to check if all host rows are opened
   * @return {param}
   */
  areAllHostRowsOpened() {
    return Object.keys(this.readoutCardList.payload).every((hostName) => this.readoutCardList.payload[hostName].open);
  }

  /**
   * Method to check if all readout cards are selected
   * @return {boolean}
   */
  areAllReadoutCardsSelected() {
    return Object.keys(this.readoutCardList.payload)
      .every((hostName) => this.areAllReadoutCardsForHostSelected(hostName));
  }

  /**
   * Method to toggle selection of all readout cards
   */
  toggleSelectionOfAllReadoutCards() {
    const areAllSelected = this.areAllReadoutCardsSelected();
    Object.keys(this.readoutCardList.payload)
      .forEach((hostName) => {
        const hosts = this.readoutCardList.payload[hostName].objects;
        Object.keys(hosts).forEach((index) => hosts[index].checked = !areAllSelected);
      });
    this.notify();
  }

  /**
   * Method to reset all CRUs to an unselected state and their hosts to an opened state
   * @param {Map<string, Map<string, string>>} readoutCardsByHost
   * @return {Map<string, Map<string, string>>}
   */
  deselectAllReadoutCards(readoutCardsByHost) {
    Object.keys(readoutCardsByHost)
      .forEach((hostName) => {
        const objects = readoutCardsByHost[hostName];
        readoutCardsByHost[hostName] = {};
        readoutCardsByHost[hostName].objects = objects;
        readoutCardsByHost[hostName].open = true;
        Object.keys(readoutCardsByHost[hostName].objects)
          .forEach((index) => readoutCardsByHost[hostName].objects[index].checked = false);
      });
    return readoutCardsByHost;
  }

  /**
   * Experts Panel
   */

  /**
   * Method to set the value of a field within the expert panel
   * @param {String} field
   * @param {String} value
   */
  setExpertOptionByField(field, value) {
    if (this.isFieldOfTypeBoolean(field)) {
      this.actionPanel.expertOptions[field] = (value === '-') ? null : (value === 'TRUE' ? true : false);
    } else if (['onu-address', 'trigger-window-size', 'cru-id'].includes(field)) {
      // type number
      const valueNumber = parseInt(value);
      if (!isNaN(valueNumber)) {
        if (valueNumber >= 0 && valueNumber <= (Math.pow(2, 31) - 1)) {
          this.actionPanel.expertOptions[field] = valueNumber;
        } else {
          this.actionPanel.expertOptions[field] = null;
        }
      } else {
        this.actionPanel.expertOptions[field] = null;
      }
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
    this.notify();
  }

  /**
   * Method to check if all links are selected
   * @return {boolean}
   */
  areAllLinksSelected() {
    return this.actionPanel.expertOptions.links.every((linkEnabled) => linkEnabled);
  }

  /**
   * Method to toggle the selection of all links
   */
  toggleAllLinksSelection() {
    this.actionPanel.expertOptions.links.fill(!this.areAllLinksSelected());
    this.notify();
  }
  /**
   * Method to build the request for AliECS - core and send it
   * * Build ROC Options
   * * Build list of selected readout cards
   * * Retrieve command
   */
  confirmSelectionAndRunCommand() {
    const rocOptions = this.getSelectedRocOptions();
    const readoutCards = this.getPciAddressOfSelectedReadoutCards();

    if (readoutCards.length > 0) {
      this.executeCommand(rocOptions, this.actionPanel.command, readoutCards);
    } else {
      this.model.notification.show('Please select at least one `Readout Card` from the table below', 'danger', 3000);
    }
  }
  /*
   * Helpers
   */

  /**
   * Method to retrieve only selected links
   * @return {Array<number>}
   */
  getSelectedLinks() {
    return Object.keys(this.actionPanel.expertOptions.links)
      .filter((index) => this.actionPanel.expertOptions.links[index]);
  }

  /**
   * Method to return a string containing the selected options and their values
   * Format: --<option> <value>
   * @return {string}
   */
  getModifiedOptionsAsString() {
    return Object.keys(this.actionPanel.expertOptions)
      .filter((option) => {
        const valuesList = this.actionPanel.expertOptions;
        return option !== 'links'
          ? valuesList[option] !== null && valuesList[option] !== '-' && valuesList[option] !== undefined
          : false;
      })
      .map((option) => `  --${option} ${this.actionPanel.expertOptions[option]} `);
  }

  /**
   * Method to build a JSON with ROC Options only with changed options
   * @return {JSONƒ}
   */
  getSelectedRocOptions() {
    const rocOptions = {};
    const options = this.actionPanel.expertOptions;
    Object.entries(options).forEach(([option, value]) => {
      if (option === 'links') {
        const linksIndex = [];
        value.forEach((selected, index) => {
          if (selected) {
            linksIndex.push(index);
          }
        });
        if (linksIndex.length > 0) {
          rocOptions['links'] = linksIndex;
        }
      } else if (value !== null && value !== '' && value !== '-') {
        rocOptions[option] = value;
      }
    });
    return rocOptions;
  }

  /**
   * Method to get the selected readout cards
   * @return{Array<String>}
   */
  getPciAddressOfSelectedReadoutCards() {
    const readoutCards = [];
    Object.keys(this.readoutCardList.payload)
      .forEach((hostName) => {
        Object.keys(this.readoutCardList.payload[hostName].objects)
          .filter((index) => this.readoutCardList.payload[hostName].objects[index].checked)
          .forEach((index) => readoutCards.push(this.readoutCardList.payload[hostName].objects[index].pciAddress));
      });
    return readoutCards;
  }

  /**
   * Method to initialize with defaults all expert options
   * @return {JSON}
   */
  getDefaultExpertOptions() {
    return {
      'cru-id': '-', // [0, 2^32 - 1]
      clock: '-',
      datapathmode: '-',
      downstreamdata: '-',
      gbtmode: '-',
      gbtmux: '-',
      links: Array(12).fill(false),
      'allow-rejection': null, // bool
      loopback: null, // bool
      'pon-upstream': null, // bool
      'dyn-offset': null, // bool
      'force-config': null, // bool
      'onu-address': null, // [0, 2^32 - 1]
      'trigger-window-size': null // [0, 2^32 - 1]
    };
  }

  /**
   * Confirm field is valid and exist in the list of roc-config options
   * @param {String} field
   * @return {boolean}
   */
  filedIsValid(field) {
    return Object.keys(this.getDefaultExpertOptions()).includes(field);
  }

  /**
   * Method to check if values are in expected format and ca be assigned to a boolean type
   * @param {string} field
   * @return {boolean}
   */
  isFieldOfTypeBoolean(field) {
    return ['allow-rejection', 'loopback', 'pon-upstream', 'dyn-offset', 'force-config'].includes(field);
  }

  /**
   * Method to check if provided field is part of the ones accepting a string value
   * @param {string} field
   * @return {boolean}
   */
  isFieldOfTypeString(field) {
    return ['cru-id', 'clock', 'datapathmode', 'downstreamdata', 'gbtmode', 'gbtmux'].includes(field);
  }

  /**
   *  HTTP Requests
   */

  /**
   * Method to retrieve a list of CRUs from Consul
   */
  async getCRUList() {
    this.readoutCardList = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.get(`/api/consul/crus`);
    if (!ok) {
      this.readoutCardList = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.readoutCardList = RemoteData.success(this.deselectAllReadoutCards(result));
    this.notify();
  }

  /**
   * Method to execute a ROC command through AliECS - Core
   * @param {JSON} rocOptions
   * @param {string} command
   * @param {Array<String>} readoutCards
   */
  async executeCommand(rocOptions, command, readoutCards) {
    this.rocStatus = RemoteData.loading();
    this.actionPanel.runButtonDisabled = true;
    this.notify();

    const body = {
      options: rocOptions,
      command: command,
      readoutCards: readoutCards
    };

    const {result, ok} = await this.model.loader.post(`/api/executeRocCommand`, body);
    this.actionPanel.runButtonDisabled = false;

    if (!ok) {
      this.rocStatus = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.rocStatus = RemoteData.success(result);
    this.notify();
  }
}
