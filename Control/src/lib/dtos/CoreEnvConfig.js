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

const User = require('./User.js');

/**
 * CoreEnvConfig DTO
 */
class CoreEnvConfig {
  /**
   * Initializing an environment configuration
   */
  constructor() { }

  /**
   * Method to check if the given user is allowed to update this env configuration by:
   * * either being author of configuration
   * * or being an admin
   * @param {User} user - user as defined by webui/framework
   * @returns {boolean} - whether the user is allowed the action
   */
  isUpdatableBy(user) {
    return User.isAdmin(user) || user.personid == this.personId;
  }

  /**
   * Given a JSON object with expected fields for an environment creation, it will return a parsed and valid
   * JSON object which will represent an environment configuration ready to be stored in Consul
   * @param {JSON} data
   * @returns {CoreEnvConfig}
   */
  static fromJSON(data) {
    const missingFields = [];
    if (!data?.name) {
      missingFields.push('name');
    }
    if (!data?.workflow) {
      missingFields.push('workflow');
    }
    if (!data?.repository) {
      missingFields.push('repository');
    }
    if (!data?.revision) {
      missingFields.push('revision');
    }

    if (missingFields.length !== 0) {
      throw new Error(`Configuration cannot be saved without the following fields: ${missingFields.toString()}`);
    } else {
      const envConfig = new CoreEnvConfig();
      envConfig._user = {
        username: data?.user?.username ?? 'anonymous',
        personid: data?.user?.personid ?? 0
      };
      envConfig._created = data.created ?? Date.now();
      envConfig._edited = data.edited ?? Date.now();
      envConfig._variables = data.variables ?? {};
      envConfig._detectors = data.detectors ?? [];
      envConfig._workflow = data.workflow;
      envConfig._revision = data.revision;
      envConfig._repository = data.repository;
      envConfig._name = data.name;
      envConfig._id = CoreEnvConfig._getNameAsId(data.name);
      return envConfig;
    }
  }

  /**
   * Method to parse a string into a JSON and attempt to create an environment configuration with it;
   * If successful, it will written an CoreEnvConfig
   * @param {String} data - string version of a JSON
   * @returns {CoreEnvConfig}
   */
  static fromString(data) {
    const envConfig = JSON.parse(data);
    return CoreEnvConfig.fromJSON(envConfig);
  }

  /**
   * Returns a string version of the current CoreEnvConfig with new lines and spaces (2)
   * @returns {String}
   */
  toString() {
    const envConfig = {
      id: this._id,
      name: this._name,
      user: this._user,
      created: this._created,
      edited: this._edited,
      workflow: this._workflow,
      revision: this._revision,
      repository: this._repository,      
      variables: this._variables,
      detectors: this._detectors,
    }
    return JSON.stringify(envConfig, null, 2)
  }

  /**
   * Method to update the newly created configuration with the existing configuration fields that should remain the same: user, created
   * @param {CoreEnvConfig} prevConfig - new configuration to be saved over the existing one
   * @returns {CoreEnvConfig} - newly updated configuration
   */
  applyUpdatableParams(prevConfig) {
    this._created = prevConfig._created;
    this._user = prevConfig._user;
    return this;
  }

  /**
   * Build the ID of the configuration to be saved from the name:
   * * Replace any existing `/` from it with `_` so that Apricot is able to understand Consul storage
   * * Replace any spaces from it with `_`
   * @param {String} name 
   * @returns {String}
   */
  static _getNameAsId(name) {
    return `${name.trim().replace(/ /g, '_')}`.replace(/\//g, '_');
  }

  /**
   * Getters / Setters
   */

  /**
   * Return the id of an environment configuration
   * @returns {String}
   */
  get id() {
    return this._id;
  }

  /**
   * Return the person id that has created the configuration
   * @returns {String}
   */
  get personId() {
    return this._user.personid;
  }
}

module.exports = CoreEnvConfig;
