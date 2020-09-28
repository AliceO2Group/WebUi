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

/* global: window */

const location = window.location;
const history = window.history;

// This are the parameters coming from the server only and represent
// the current session
const parametersNames = ['personid', 'name', 'token'];

/**
 * Singleton to retrieve and hide the parameters passed as query string.
 * @module sessionService
 */
export default {
  session: null,

  /**
   * Load parameters from the query string inside sessionService
   * and remove them from the query string.
   */
  loadAndHideParameters() {
    this._loadParameters();
    this._hideParameters();
  },

  /**
   * Load the session parameters from query string into the session object
   */
  _loadParameters() {
    if (this.session) {
      throw new Error('the session is already loaded');
    }
    const url = new URL(location);
    this.session = {};
    parametersNames.forEach((parameterName) => {
      this.session[parameterName] = url.searchParams.get(parameterName);
      if (!this.session[parameterName]) {
        throw new Error(`query string should contain the parameter ${parameterName}`);
      }
    });
  },

  /**
   * Replace the current URL without the session parameters
   */
  _hideParameters() {
    const url = new URL(location);
    parametersNames.forEach((parameterName) =>
      url.searchParams.delete(parameterName)
    );
    history.replaceState({}, '', url);
  },

  /**
   * Returns the current session object with all server parameters inside
   * @return {object} session
   */
  get() {
    if (!this.session) {
      throw new Error('session has not been loaded');
    }

    return this.session;
  }
};

