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

    this._runNumber = null;
    this._runStatus = null;
    this._isRunModeActivated = false;
    this._lastRefresh = null;

    this.ONGOING_RUN_INTERVAL_MS = 15000;
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
    if (this.isRunModeActivated) {
      this.runNumber = this._filterMap['RunNumber'];
      this.runStatus = await this.filterService.getRunStatus(this.runNumber);
      this.notify();
      this._manageRunsModeInterval(baseViewModel);
    }
    baseViewModel.triggerFilter();
    this._lastRefresh = Date.now();
    this.notify();
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
   * Clears all currently set filters and triggers a filter action on the provided view model.
   * @param {BaseViewModel} baseViewModel - The view model that should be filtered
   * @returns {void}
   */
  clearFiltersAndTrigger(baseViewModel) {
    this.clearFilters();
    this.triggerFilter(baseViewModel);
  }

  /**
   * Clears all filters without triggering a filter action, but still updates the URL and notifies observers.
   * @returns {void}
   */
  clearFilters() {
    this._filterMap = {};
    this.setFilterToURL(true);
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
   * @param {object} viewModel The model of the view
   * @returns {Promise<void>}
   */
  async activateRunsMode(viewModel) {
    this.isRunModeActivated = true;
    await this.filterService.fetchOngoingRuns();
    if (this._filterMap.RunNumber) {
      this._filterMap = { RunNumber: this._filterMap.RunNumber };
      this.triggerFilter(viewModel);
    } else {
      const { ongoingRuns } = this.filterService;
      if (ongoingRuns.isSuccess() && ongoingRuns.payload.length > 0) {
        this._filterMap = { RunNumber: String(ongoingRuns.payload[0]) };
        this.triggerFilter(viewModel);
      } else {
        this._filterMap = {};
      }
    }
    this.notify();
  }

  /**
   * Deactivates the runs mode
   * @param {object} baseViewModel - The view model that provides the triggerFilter method.
   * @returns {Promise<void>}
   */
  async deactivateRunsMode(baseViewModel) {
    this.resetRunsMode();
    this.clearFilter(baseViewModel);
  }

  /**
   * Resets the runs mode state
   * @returns {void}
   */
  resetRunsMode() {
    this.isRunModeActivated = false;
    this.runNumber = null;
    this.runStatus = null;
    this._lastRefresh = null;
    this.clearRunsModeInterval();
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
    const currentRunNumber = this.runNumber;
    if (this.runStatus !== RunStatus.ONGOING) {
      return;
    }
    this._runsModeInterval = setInterval(async () => {
      if (!baseViewModel) {
        return;
      }
      this.runStatus = await this.filterService.getRunStatus(currentRunNumber);
      this.notify();

      if (this.runStatus !== RunStatus.ONGOING) {
        this.clearRunsModeInterval();
      }
      baseViewModel.triggerFilter();
      this._lastRefresh = Date.now();
      this.notify();
    }, this.ONGOING_RUN_INTERVAL_MS);
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
  }

  /**
   * Restarts the runs mode interval if needed
   * @param {object} baseViewModel - The view model that provides the triggerFilter method
   * @returns {void}
   */
  restartRunsModeIntervals(baseViewModel) {
    if (!this.isRunModeActivated) {
      return;
    }
    if (this.runStatus === RunStatus.ONGOING && !this._runsModeInterval) {
      this._manageRunsModeInterval(baseViewModel);
    }
  }

  /**
   * Gets the current run number.
   * @returns {number} The run number.
   */
  get runNumber() {
    return this._runNumber;
  }

  /**
   * Sets the run number.
   * @param {number} value - The new run number.
   */
  set runNumber(value) {
    this._runNumber = value;
  }

  /**
   * Gets the current run status.
   * @returns {RemoteData} The run status.
   */
  get runStatus() {
    return this._runStatus;
  }

  /**
   * Sets the run status.
   * @param {RemoteData} value - The new run status.
   */
  set runStatus(value) {
    this._runStatus = value;
  }

  /**
   * Gets the current run mode status.
   * @returns {boolean} True if turned on.
   */
  get isRunModeActivated() {
    return this._isRunModeActivated;
  }

  /**
   * Sets the run mode status.
   * @param {boolean} value - True if should be turned on.
   */
  set isRunModeActivated(value) {
    this._isRunModeActivated = value;
  }

  get lastRefresh() {
    return this._lastRefresh;
  }

  get runsModeInterval() {
    return this._runsModeInterval;
  }

  /**
   * Validates a run number for run mode.
   * @returns {{ isValid: boolean, title: string }} An object indicating
   *          whether the run number is valid and a corresponding message.
   */
  validateRunNumber() {
    const runNumber = this._filterMap?.RunNumber;
    if (runNumber === undefined || runNumber === null || runNumber === '') {
      if (this.isRunModeActivated) {
        return { isValid: false, title: 'Run number is required' };
      } else {
        return { isValid: true, title: 'Update filters' };
      }
    }
    if (isNaN(runNumber)) {
      return { isValid: false, title: 'Run number must be a valid number' };
    }
    if (!Number.isInteger(Number(runNumber))) {
      return { isValid: false, title: 'Run number must be an integer' };
    }
    //must be positive
    if (Number(runNumber) < 0) {
      return { isValid: false, title: 'Run number must be a positive integer' };
    }
    if (Number(runNumber) > 999999) {
      return { isValid: false, title: 'Run number must be 999999 or less' };
    }
    return { isValid: true, title: 'Update filters' };
  };

  /**
   * Executes a generic check to determine if a refresh is required.
   * @param {() => Promise<T>} fetchFn - Async function to fetch the data or object.
   * @param {(RemoteData) => boolean} validateFn - Validates whether the fetched result means no refresh is needed.
   * @returns {Promise<{ refreshNeeded: boolean, data: object | null }>}
   * a promise with if is needed to refresh and the fetched data (if fetched)
   */
  async refreshCheck(fetchFn, validateFn) {
    if (this._runsModeInterval) {
      const data = await fetchFn();
      const refreshNeeded = validateFn(data);
      return { refreshNeeded, data };
    }
    return { refreshNeeded: true, data: null };
  }
}
