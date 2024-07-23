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
   * @param {string} username - username of the user
   * @param {string} fullName - full name to be displayed for the user
   * @param {number} personid - id of the user
   * @param {Array<string> | string} access - list of access roles of the user
   */
  constructor(username, fullName, personid, access = []) {
    /**
     * @type {string}
     */
    this._username = username;

    /**
     * @type {string}
     */
    this._fullName = fullName;

    /**
     * @type {number}
     */
    this._personid = personid;

    /**
     * @type {Array<string>}
     */
    this._accessList = [];
    if (typeof access === 'string') {
      this._accessList = access.split(',');
    } else if (Array.isArray(access)) {
      this._accessList = access;
    }
  }

  /**
   * Checks if the given user is considered admin
   * @param {User} user - user type object as defined by webui/framework
   * @returns {boolean}
   */
  static isAdmin({ access = '' }) {
    let accessList = [];
    if (typeof access === 'string') {
      accessList = access.split(',');
    } else if (Array.isArray(access)) {
      accessList = access;
    }
    return Boolean(accessList.includes('admin'));
  }

  /**
   * Check if provided details of a user are the same as the current instance one;
   * @param {User} user - to compare to
   * @returns {boolean}
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
   * Returns the full name of the user
   * @returns {string}
   */
  get fullName() {
    return this._fullName;
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
   * @returns {Array<string>}
   */
  get access() {
    return this._accessList;
  }

  /**
   * Returns the JSON representation of the user that is to be sent via HTTP
   * @returns {JSON{User}}
   */
  toJSON() {
    return {
      username: this._username,
      fullName: this._fullName,
      personid: this._personid,
    };
  }
}

exports.User = User;
