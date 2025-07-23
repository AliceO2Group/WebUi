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
import { buildQueryParametersString } from '../../buildQueryParametersString.js';
import FilterService from '../../../services/Filter.service.js';
import { RunStatus } from '../../../library/runStatus.enum.js';
const CCDB_QUERY_PARAMS = ['PeriodName', 'PassName', 'RunNumber', 'RunType'];

/**
 * Model namespace that manages the filter state in the application.
 */
export default class FilterModel extends Observable {
  /**
   * Initialize with empty values
   * @param {Model} model - root model of the application
   */
  constructor(model) {
    super();

    this.model = model;
    this.filterService = new FilterService(this);
    this._filterMap = {};
    this.isVisible = true;
    this._runsModeInterval = null;

    // Run mode
    this._inRunMode = false;
    this._runNumber = null;
    this._runStatus = RunStatus.UNKNOWN;
    this.dropdownOpen = false;
    this.statusInfoOpen = false;
  }

  /**
   * Look for parameters used for filtering in URL and apply them in the layout if it exists
   * @returns {undefined}
   */
  setFilterFromURL() {
    const parameters = this.model.router.params;
    CCDB_QUERY_PARAMS.forEach((filterKey) => {
      if (parameters[filterKey]) {
        this._filterMap[filterKey] = decodeURI(parameters[filterKey]);
      }
    });

    this.filterService.runTypes.match({
      Success: (runTypes) => {
        if (runTypes.length > 0 && !runTypes.includes(this._filterMap.RunType)) {
          delete this._filterMap.RunType;
        }
      },
      Other: () => null,
    });

    this.notify();
  }

  /**
   * When the user updates the displayed Objects, the filters should be placed in the URL as well
   * @param {boolean} isSilent - whether the route should be silent or not
   * @returns {undefined}
   */
  setFilterToURL(isSilent = true) {
    const parameters = this.model.router.params;

    CCDB_QUERY_PARAMS.forEach((filterKey) => {
      if (!this._filterMap[filterKey]) {
        delete parameters[filterKey];
      } else {
        parameters[filterKey] = encodeURI(this._filterMap[filterKey]);
      }
    });
    this.model.router.go(buildQueryParametersString(parameters, {}), true, isSilent);
  }

  /**
   * Method to allow the addition/update/removal of key;value pairs in filter object
   * Method should exlusively be used for input values
   * @param {string} key - key to look for in filterMap
   * @param {string} value - value to update for given key; if none, entry is removed from object
   * @param {boolean} setUrl - Whether to immediately persist the value in the url
   * @returns {undefined}
   */
  setFilterValue(key, value, setUrl = false) {
    if (value?.trim()) {
      this._filterMap[key] = value;
    } else {
      delete this._filterMap[key];
    }

    if (setUrl) {
      this.setFilterToURL();
    }

    this.notify();
  };

  /**
   * Apply the current filters to a filterable model and update the URL
   * @param {BaseViewModel} baseViewModel - The view model that should be filtered
   * @returns {undefined}
   */
  async triggerFilter(baseViewModel) {
    this.setFilterToURL();
    if (this.inRunMode) {
      this.runStatus = await this.filterService.getRunStatus(this.runNumber);
    }
    baseViewModel.triggerFilter();
  }

  /**
   * Toggle the visibility state of the filter component
   * @returns {undefined}
   */
  toggleFilterVisibility() {
    this.isVisible = !this.isVisible;
    this.notify();
  }

  /**
   * Clears all currently set filters and updates the URL accordingly
   * @param {BaseViewModel} baseViewModel - The view model that should be filtered
   * @returns {undefined}
   */
  clearFilter(baseViewModel) {
    this._filterMap = {};

    this.triggerFilter(baseViewModel);
    this.notify();
  }

  get filterMap() {
    return this._filterMap;
  }

  /**
   * Check if any filters are currently active in the URL parameters
   * @returns {boolean} True if any filter parameters are present in the URL
   */
  activeFilter() {
    const { params } = this.model.router;
    return CCDB_QUERY_PARAMS.some((filterKey) => params[filterKey]?.trim());
  }

  /**
   * Activates the runs mode
   * @param {object} baseViewModel - The view model that provides the triggerFilter method.
   * @returns {Promise<void>}
   */
  async activateRunsMode(baseViewModel) {
    // Save current filters before activating run mode
    this._previousFilterMap = { ...this._filterMap };
    this.runNumber = this._filterMap.RunNumber;

    // Clear all filters except RunNumber
    this._filterMap = { RunNumber: this._runNumber };

    // Activate run mode
    this.inRunMode = true;
    await this.triggerFilter(baseViewModel);
    this._manageRunsModeInterval(baseViewModel);
    this.notify();
  }

  /**
   * Deactivates the runs mode
   * @param {object} baseViewModel - The view model that provides the triggerFilter method.
   * @returns {Promise<void>}
   */
  async deactivateRunsMode(baseViewModel) {
    this._filterMap = this._previousFilterMap || {};
    this.resetRunsMode();
    this.setFilterToURL();
    await baseViewModel.triggerFilter();
    this.notify();
  }

  /**
   * Resets the runs mode state
   * @returns {void}
   */
  resetRunsMode() {
    this.inRunMode = false;
    this.runNumber = null;
    this.runStatus = RunStatus.UNKNOWN;
    this.clearRunsModeInterval();
    this.dropdownOpen = false;
    this.statusInfoOpen = false;
    this._previousFilterMap = null;
    this.notify();
  }

  /**
   * Starts an interval to refresh data periodically while the run is ongoing.
   * The interval is cleared if the run ends.
   * @param {object} baseViewModel - The view model used to trigger data refresh.
   * @returns {Promise<void>}
   */
  async _manageRunsModeInterval(baseViewModel) {
    this.clearRunsModeInterval();
    this._currentViewModel = baseViewModel;
    if (this.runStatus === RunStatus.ONGOING) {
      this._runsModeInterval = setInterval(async () => {
        if (this._currentViewModel) {
          await this.triggerFilter(this._currentViewModel);
          if (this.runStatus !== RunStatus.ONGOING) {
            this.clearRunsModeInterval();
          }
        }
        // TODO: Should be provided in config file (ticket OGUI-1743)
      }, 5000);
    }
  }

  /**
   * Clears the interval set during runs mode.
   * @returns {void}
   */
  clearRunsModeInterval() {
    if (this._runsModeInterval) {
      clearInterval(this._runsModeInterval);
      this._runsModeInterval = null;
    }
    this._currentViewModel = null;
  }

  /**
   * Restarts the runs mode interval if needed
   * @param {object} baseViewModel - The view model that provides the triggerFilter method
   * @returns {void}
   */
  restartRunsModeIntervals(baseViewModel) {
    if (this.inRunMode && this.runStatus === RunStatus.ONGOING) {
      this._manageRunsModeInterval(baseViewModel);
    }
  }

  /**
   * Checks if run mode is activated
   * @returns {boolean} true if activated
   */
  get inRunMode() {
    return this._inRunMode;
  }

  /**
   * Set run mode
   * @param {boolean} value - Whether to activate or deactivate run mode
   * @returns {void}
   */
  set inRunMode(value) {
    this._inRunMode = value;
    this.notify();
  }

  /**
   * Get run number
   * @returns {null | number} Run number or null if not set
   */
  get runNumber() {
    return this._runNumber;
  }

  /**
   * Set run number
   * @param {number} runNumber - The run number to set
   * @returns {void}
   */
  set runNumber(runNumber) {
    this._runNumber = runNumber;
    this.notify();
  }

  /**
   * Get run status
   * @returns {RunStatus} The current run status
   */
  get runStatus() {
    return this._runStatus;
  }

  /**
   * Set run status
   * @param {RunStatus} runStatus - The run status to set
   * @returns {void}
   */
  set runStatus(runStatus) {
    this._runStatus = runStatus;
    this.notify();
  }

  /**
   * Validates if a run number is a valid number
   * @param {string|number} runNumber - The run number to validate
   * @returns {boolean} True if the run number is valid
   */
  isValidRunNumber(runNumber) {
    return runNumber && !isNaN(Number(runNumber)) && Number.isInteger(Number(runNumber));
  }
}
