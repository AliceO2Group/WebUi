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

import { Observable } from '/js/src/index.js';

/**
 * Model representing Workflow Template configuration that is to be potentially used for deploying an environment
 */
export default class WorkflowForm extends Observable {
  /**
   * Initialize WorkflowForm component
   */
  constructor() {
    super();

    this.repository = '';
    this.revision = '';
    this.template = '';

    this.variables = {};
    this.basicVariables = {};

    this.hosts = [];
    this._detectors = [];
  }

  /**
   * Set template metadata information
   * @param {object} - information retrieved for the default configuration template
   * @param -.repository
   * @param -.revision
   * @param -.template
   * @returns {void}
   */
  setTemplateInfo({ repository = '', revision = '', template = '' }) {
    this.repository = repository;
    this.revision = revision;
    this.template = template;
  }

  /**
   * Method to check that all mandatory fields were filled
   * @returns {boolean}
   */
  isInputSelected() {
    return this.repository.trim() !== ''
      && this.revision.trim() !== ''
      && this.template.trim() !== '';
  }

  /**
   * Set template selected by the user from the list
   * @param {string} template
   */
  setTemplate(template) {
    this.template = template;
    this.notify();
  }

  /**
   * Set the hosts selected by the user
   * @param {Array<string>} hosts
   */
  setHosts(hosts) {
    this.hosts = JSON.parse(JSON.stringify(hosts));
    this.notify();
  }

  /**
   * Retrieve a list of hosts selected by the user
   * @returns {Array<string>}
   */
  getHosts() {
    return JSON.parse(JSON.stringify(this.hosts));
  }

  /**
   * Add a host to the list of selected ones if it is not included already
   * @param {string} host
   */
  addHost(host) {
    if (!this.hosts.includes(host)) {
      this.hosts.push(host);
    }
    this.notify();
  }

  /**
   * Remove a selected host by its index
   * @param {number} index
   */
  removeHostByIndex(index) {
    this.hosts.splice(index, 1);
    this.notify();
  }

  /**
   * Reset the selection for variables
   */
  resetVariables() {
    this.variables = {};
    this.basicVariables = {};
    this.notify();
  }
}
