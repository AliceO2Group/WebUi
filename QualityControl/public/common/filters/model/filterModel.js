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
    this.filterMap = {};
  }

  /**
   * Look for parameters used for filtering in URL and apply them in the layout if it exists
   * @returns {undefined}
   */
  setFilterFromURL() {
    const parameters = this.model.router.params;
    CCDB_QUERY_PARAMS.forEach((filterKey) => {
      if (parameters[filterKey]) {
        this.filterMap[filterKey] = decodeURI(parameters[filterKey]);
      }
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
      if (!this.filterMap[filterKey]) {
        delete parameters[filterKey];
      } else {
        parameters[filterKey] = encodeURI(this.filterMap[filterKey]);
      }
    });
    this.model.router.go(buildQueryParametersString(parameters, { }), true, isSilent);
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
      this.filterMap[key] = value;
    } else {
      delete this.filterMap[key];
    }

    if (setUrl) {
      this.setFilterToURL();
    }

    this.notify();
  };

  triggerFilter(filterAbleModel) {
    this.setFilterToURL();
    filterAbleModel.triggerFilter(this.filterMap);
  }
}
