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
   * @param {String} username - username of the user
   * @param {Number} personid - id of the user
   * @param {Array<String>|String} access - list of access roles of the user
   */
  constructor(username, personid, access) {
    /**
     * @type {String}
     */
    this._username = username;
    /**
     * @type {number}
     */
    this._personid = personid;
    /**
     * @type {string}
     */
    this._access = access;
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

  /**
   * Returns the JSON representation of the user that is to be sent via HTTP
   * @return {JSON{User}}
   */
  toJSON() {
    return {
      username: this._username,
      personid: this._personid,
    };
  }
}

exports.User = User;
