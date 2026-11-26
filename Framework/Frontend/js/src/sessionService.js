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

/* Global: window */

const { location } = window;
const { history } = window;

/**
 * These are the parameters coming from the server only and represent
 * the current session
 */
const authenticationParametersNames = ['personid', 'name', 'token', 'username', 'access'];

/**
 * Class to store authenticated users's session and provide session-related services
 */
export class SessionService {
  /**
   * Constructor
   */
  constructor() {
    this.session = null;
  }

  /**
   * Load parameters from the query string inside sessionService
   * and remove them from the query string.
   * Without a token, redirects to the login and throws to stop the caller while the page unloads.
   * @return {void}
   * @throws {Error} when there is no token (redirecting) or a session parameter is missing
   */
  loadAndHideParameters() {
    if (this.session) {
      throw new Error('the session is already loaded');
    }
    const url = new URL(location);

    if (!url.searchParams.has('token')) {
      const loginUrl = new URL('/api/auth/login', location.origin);
      loginUrl.search = url.search; // The server drops any stale session parameters
      // Replace so the page without a token is not left in the history, where "back" would redirect again
      location.replace(loginUrl);
      throw new Error('No session token, redirecting to login');
    }

    this.session = {};

    for (const authenticationParameterName of authenticationParametersNames) {
      const authenticationParameter = url.searchParams.get(authenticationParameterName);

      if (!authenticationParameter) {
        throw new Error(`query string should contain the parameter ${authenticationParameterName}`);
      }

      this.session[authenticationParameterName] = authenticationParameterName === 'access'
        ? authenticationParameter.split(',')
        : authenticationParameter;

      url.searchParams.delete(authenticationParameterName);
    }

    history.replaceState({}, '', url);
  }

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

  /**
   * States if the currently authenticated user has at least one of the given role
   *
   * @param {string|string[]} roles the role(s) to check
   * @return {boolean} true if the user has one of the given roles, else false
   */
  hasAccess(roles) {
    const { access } = this.get();

    return access.some((userRole) => roles.includes(userRole));
  }
}

/**
 * Singleton to retrieve and hide the parameters passed as query string.
 * @module sessionService
 */
export default new SessionService();
