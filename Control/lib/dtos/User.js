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
'use strict';

/**
 * User DTO
 */
class User {
  /**
   * Initializing an environment configuration
   * @param {session} - request session as set by webui/framework server
   */
  constructor(session) {
    /**
     * @type {String}
     */
    this._username = session.username;
    /**
     * @type {number}
     */
    this._personid = session.personid;
    /**
     * @type {string}
     */
    this._access = session.access;
  }

  /**
   * Checks if the given user is considered admin
   * @param {User} user - user type object as defined by webui/framework
   * @returns {boolean}
   */
  static isAdmin(user) {
    return Boolean(user?.access.includes('admin'));
  }

  /**
   * Check if provided details of a user are the same as the current instance one;
   * @param {User} user - to compare to
   * @return {Boolean}
   */
  isSameUser(user) {
    return this._username === user.username && this._personid === this.personid;
  }

  /**
   * Returns the username
   * @returns {string}
   */
  get username() {
    return this._username;
  }

  /**
   * Returns the personid of the user
   * @returns {number}
   */
  get personid() {
    return this._personid;
  }

  /**
   * Returns the access granted to this user
   * @returns {string}
   */
  get access() {
    return this._access;
  }
}

module.exports = User;
