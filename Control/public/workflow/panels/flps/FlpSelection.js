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

    this.hostsByDetectors = {};

    this.detectors = RemoteData.notAsked();
    this.activeDetectors = RemoteData.notAsked();
    this.selectedDetectors = [];
    this.unavailableDetectors = []; // detectors which are loaded from configuration but active in AliECS
    this.missingHosts = [];
    this.detectorViewConfigurationError = false;
  }

  /**
   * Initialize detectors and hosts panels with empty selection
   */
  async init() {
    this.selectedDetectors = [];
    this.list = RemoteData.notAsked();
    this.hostsByDetectors = {};
    this.workflow.form.setHosts([]);
    this.unavailableDetectors = [];
    this.missingHosts = [];
    this.detectorViewConfigurationError = false;
    this.notify();

    await this.getAndSetDetectors();

    if (this.workflow.model.detectors.isSingleView()
      && this.activeDetectors.isSuccess()
      && !this.activeDetectors.payload.detectors.includes(this.workflow.model.detectors.selected)
    ) {
      // if single view preselect detectors and hosts for users
      this.toggleDetectorSelection(this.workflow.model.detectors.selected);
    }
  }

  /**
   * Method to request a list of detectors from AliECS and initialized the user form accordingly
   */
  async getAndSetDetectors() {
    this.detectors = this.workflow.model.detectors.listRemote;

    this.activeDetectors = RemoteData.loading();
    this.notify();
    const {result, ok} = await this.workflow.model.loader.post('/api/GetActiveDetectors', {});
    this.activeDetectors = ok ? RemoteData.success(result) : RemoteData.failure(result.message);

    this.notify();
  }

  /**
   * Given a list of detectors and hosts:
   * * update the data from AliECS with available detectors
   * * make the selection of the detectors based on passed values
   * * make the selection of the hosts based on passed values
   * * inform the user if some are unavailable anymore
   * @param {Array<String>} detectors 
   * @param {Array<String>} hosts 
   */
  async setDetectorsAndHosts(detectors, hosts) {
    this.init();

    await this.getAndSetDetectors(); // get the latest information on detectors

    detectors.map((detector) => {
      if (this.activeDetectors.isSuccess() && !this.activeDetectors.payload.detectors.includes(detector)) {
        this.selectedDetectors.push(detector);
        this.setHostsForDetector(detector);
        hosts.forEach((host) => {
          if (this.hostsByDetectors[detector].includes(host)) {
            this.workflow.form.addHost(host);
          }
        });
      }
      if (this.activeDetectors.isSuccess() && this.activeDetectors.payload.detectors.includes(detector)) {
        this.unavailableDetectors.push(detector);
      }
    });
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
        this.setHostsForDetector(name, true);
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
   * Remove a detector and its corresponding hosts
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
   * Given a detector name, build a string containing the name and number of selected hosts
   * and available hosts for that detector
   * @param {String} detector
   * @returns {String}
   */
  getDetectorWithIndexes(detector) {
    const hostsByDetectorRemote = this.workflow.model.detectors.hostsByDetectorRemote;
    if (hostsByDetectorRemote.isSuccess() && hostsByDetectorRemote.payload[detector]) {
      const hosts = hostsByDetectorRemote.payload[detector];
      const selectedHosts = this.workflow.form.hosts;
      const totalSelected = selectedHosts.filter((host) => hosts.includes(host)).length;

      return detector + ' (' + totalSelected + '/' + hosts.length + ')'
    }
    return detector;
  }

  /**
   * Given a detector name, if hosts were successfully loaded on page load,
   * update the list of hosts by adding the ones for the given detector
   * If specified via shouldSelect, it will also add the hosts to the form so that they appeared
   * as selected for the user
   * @param {String} detector
   */
  setHostsForDetector(detector, shouldSelect = false) {
    const hostsByDetectorRemote = this.workflow.model.detectors.hostsByDetectorRemote;
    if (!hostsByDetectorRemote.isSuccess()) {
      this.list = RemoteData.failure(hostsByDetectorRemote.message);
    } else {
      this.hostsByDetectors[detector] = hostsByDetectorRemote.payload[detector];
      let temp = [];
      Object.keys(this.hostsByDetectors).forEach((detector) => temp = temp.concat(this.hostsByDetectors[detector]));
      this.list = RemoteData.success(temp);
      if (shouldSelect) {
        this.hostsByDetectors[detector].forEach((hostname) => this.workflow.form.addHost(hostname));
      }
    }
    this.notify();
  }
}