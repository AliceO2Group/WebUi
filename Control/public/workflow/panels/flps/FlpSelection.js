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

    this.list = RemoteData.notAsked();
    this.firstFlpSelection = -1;

    this.hostsByDetectors = {}

    this.detectors = RemoteData.notAsked();
    this.activeDetectors = RemoteData.notAsked();
    this.selectedDetectors = [];
    this.unavailableDetectors = []; // detectors which are loaded from configuration but active in AliECS
    this.missingHosts = [];
  }

  /**
   * Method to request a list of detectors from AliECS
   */
  async getAndSetDetectors() {
    this.detectors = await this.workflow.remoteDataPostRequest(this.detectors, '/api/ListDetectors', {});
    this.activeDetectors = await this.workflow.remoteDataPostRequest(this.activeDetectors, '/api/GetActiveDetectors');
  }

  /**
   * Given a list of detectors and hosts:
   * * update the data from AliECS with available detectors
   * * make the selection of the detectors based on passed values
   * * make the seleciton of the hosts based on passed values
   * * inform the user if some are unavailable anymore
   * @param {Array<String>} detectors 
   * @param {Array<String>} hosts 
   */
  async setDetectorsAndHosts(detectors, hosts) {
    await this.getAndSetDetectors(); // get the latest information on detectors

    // Initialize selection
    this.selectedDetectors = [];
    this.list = RemoteData.notAsked();
    this.hostsByDetectors = {}
    this.workflow.form.setHosts([]);
    this.unavailableDetectors = [];
    this.missingHosts = [];

    await Promise.all(
      detectors.map(async (detector) => {
        if (this.activeDetectors.isSuccess() && !this.activeDetectors.payload.detectors.includes(detector)) {
          this.selectedDetectors.push(detector);
          await this.getAndSetHostsForDetector(detector);
          hosts.forEach((host) => {
            if (this.hostsByDetectors[detector].includes(host)) {
              this.workflow.form.addHost(host);
            }
          });
        }
        if (this.activeDetectors.isSuccess() && this.activeDetectors.payload.detectors.includes(detector)) {
          this.unavailableDetectors.push(detector);
        }
      })
    );
    hosts.filter((host) => !this.workflow.form.hosts.includes(host))
      .forEach((host) => this.missingHosts.push(host));
    this.notify();
  }

  /**
   * Toggle selection of a detector. A detector can have one of the 3 states:
   * * active
   * * available
   * * unavailable
   * @param {String} name
   */
  toggleDetectorSelection(name) {
    const indexUnavailable = this.unavailableDetectors.indexOf(name)
    if (indexUnavailable >= 0) {
      this.unavailableDetectors.splice(indexUnavailable, 1);
    } else {
      const index = this.selectedDetectors.indexOf(name);
      if (index >= 0) {
        this.selectedDetectors.splice(index, 1);
        this.removeHostsByDetector(name);
      } else if (!this.isDetectorActive(name)) {
        this.selectedDetectors.push(name);
        this.getAndSetHostsForDetector(name);
      }
    }
    this.notify();
  }

  /**
   * Given a name of a detector, it checks if it is part of the active list
   * @param {String} name 
   * @returns {boolean}
   */
  isDetectorActive(name) {
    return this.activeDetectors.isSuccess() && this.activeDetectors.payload.detectors.includes(name)
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
   * Remove a detector and its correspoding hosts
   * @param {String} detector
   */
  removeHostsByDetector(detector) {
    if (this.hostsByDetectors[detector]) {
      this.hostsByDetectors[detector].forEach((host) => {
        // Delete hosts of the detector from form selection
        const index = this.workflow.form.hosts.indexOf(host);
        if (index >= 0) {
          this.workflow.form.hosts.splice(index, 1);
        }
      })
      delete this.hostsByDetectors[detector];

      let temp = []
      // update list of displayed hosts with remaining ones
      Object.keys(this.hostsByDetectors).forEach((detector) => temp = temp.concat(this.hostsByDetectors[detector]))
      this.list = RemoteData.success(temp);
      this.notify();
    }
  }

  /**
   * Method to return the name of the detector to which a given host name belongs to
   * @param {String} host 
   */
  getDetectorForHost(host) {
    let detectorForHost = '';
    Object.keys(this.hostsByDetectors).forEach((detector) => {
      const hosts = this.hostsByDetectors[detector];
      if (hosts.includes(host)) {
        detectorForHost = detector;
      }
    });
    return detectorForHost;
  }

  /**
   * HTTP Requests
   */

  /**
   * Given a detector name, request a list of FLPs from Core
   * @param {String} detector
   */
  async getAndSetHostsForDetector(detector) {
    this.list = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.loader.post(`/api/GetHostInventory`, {detector});
    if (!ok) {
      this.list = RemoteData.failure(result.message);
    } else {
      this.hostsByDetectors[detector] = result.hosts
      let temp = []
      Object.keys(this.hostsByDetectors).forEach((detector) => temp = temp.concat(this.hostsByDetectors[detector]))
      this.list = RemoteData.success(temp);
    }
    this.notify();
  }
}