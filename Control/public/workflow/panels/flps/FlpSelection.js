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
export default class FlpSelection extends Observable {
  /**
   * Initialize FLPs Selection Component
   * @param {Object} workflow
   */
  constructor(workflow) {
    super();
    this.loader = workflow.model.loader;
    this.workflow = workflow;

    this.list = RemoteData.notAsked(); // list of FLPs gathered from Consul

    this.firstFlpSelection = -1;

    this.consulReadoutPrefix = ''; // Used in Readout URI field of Basic Configuration Panel
    this.consulKvStoreReadout = '';

    this.consulQcPrefix = ''; // Used in Readout URI field of Basic Configuration Panel
    this.consulKvStoreQC = '';
  }

  /**
   * Toggle the selection of an FLP from the form host
   * The user can also use SHIFT key to select between 2 FLP machines, thus
   * selecting all machines between the 2 selected
   * @param {string} name
   * @param {Event} e
   */
  toggleFLPSelection(name, e) {
    if (e.shiftKey && this.list.isSuccess()) {
      if (this.firstFlpSelection === -1) {
        this.firstFlpSelection = this.list.payload.indexOf(name);
      } else {
        let secondFlpSelection = this.list.payload.indexOf(name);
        if (this.firstFlpSelection > secondFlpSelection) {
          [this.firstFlpSelection, secondFlpSelection] = [secondFlpSelection, this.firstFlpSelection];
        }
        for (let flpIndex = this.firstFlpSelection; flpIndex <= secondFlpSelection; ++flpIndex) {
          const flpName = this.list.payload[flpIndex];
          const hostFormIndex = this.workflow.form.getHosts().indexOf(flpName);
          if (hostFormIndex < 0) {
            this.workflow.form.addHost(flpName);
          }
        }
        this.firstFlpSelection = -1;
      }
    } else {
      this.firstFlpSelection = -1;
      const index = this.workflow.form.hosts.indexOf(name);
      if (index < 0) {
        this.workflow.form.addHost(name);
      } else {  
        this.workflow.form.removeHostByIndex(index);
      }
    }
    this.notify();
  }

  /**
   * If all FLPs are selected than deselect them
   * Else select all FLPs
   */
  toggleAllFLPSelection() {
    this.workflow.form.hosts = this.areAllFLPsSelected() ? [] : JSON.parse(JSON.stringify(this.list.payload));
    this.notify();
  }

  /**
   * Check if all FLPs are selected
   * @return {boolean}
   */
  areAllFLPsSelected() {
    return this.list.isSuccess() && this.workflow.form.hosts.length === this.list.payload.length;
  }

  /**
   * HTTP Requests
   */

  /**
   * Method to request a list of FLPs
   */
  async setFLPListByRequest() {
    this.list = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.loader.get(`/api/getFLPs`);
    if (!ok) {
      this.list = RemoteData.failure(result.message);
      this.consulReadoutPrefix = '';
      this.consulQcPrefix = '';
      this.consulKvStoreQC = '';
      this.consulKvStoreReadout = '';
      this.notify();
      return;
    }
    this.consulReadoutPrefix = result['consulReadoutPrefix'];
    this.consulQcPrefix = result['consulQcPrefix'];
    this.consulKvStoreReadout = result['consulKvStoreReadout'];
    this.consulKvStoreQC = result['consulKvStoreQC'];
    this.list = RemoteData.success(result.flps);
    if (this.workflow.form.getHosts().length === 0) {
      // preselect all hosts if hosts were not selected already previously
      this.workflow.form.hosts = Object.values(result.flps);
    } else {
      // FLP machines can be removed by the user since the last creation of an environment
      // ensure the list of selected items is still up to date
      const tempFormHosts = [];
      const hosts = this.workflow.form.getHosts();
      hosts.filter((host) => this.list.payload.includes(host)).forEach((host) => tempFormHosts.push(host));
      this.workflow.form.setHosts(tempFormHosts.slice());
    }
    this.notify();
  }
}