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

const jwt = require('jsonwebtoken');
const {randomBytes} = require('crypto');

/**
 * Provides JSON Web Token functionality such as token generation and verification with `jsonwebtoken` library
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class O2WebToken {
  /**
   * Constructor which initializes the O2WebToken with provided configuration
   * @constructor
   * @param {object} config - configuration object
   */
  constructor(config) {
    this._expiration = config?.expiration || '1d';
    this._maxAge = config?.maxAge || '7d';
    this._secret = config?.secret || randomBytes(256).toString('hex');
    this._issuer = config?.issuer || 'o2-ui';
  }

  /**
   * Generates encrypted token with user info and access level.
   * Sets expiration time and sings it using secret.
   * @param {number} personid - CERN user id
   * @param {string} username - CERN username
   * @param {string} name - CERN username
   * @param {string} access - comma separated list of access scopes; Defaults to empty string if not provided
   * @return {string} generated token
   */
  generateToken(personid, username, name, access = '') {
    return jwt.sign({id: personid, username, name, access}, this._secret, {
      expiresIn: this._expiration,
      issuer: this._issuer
    });
  }

  /**
   * Attempts to decrypt passed token to verify its validity.
   * If token is valid, decode data from it will be returned, else an error is thrown
   * @param {string} token - token to be verified
   * @return {Object>} whether operation was successful, if so decoded data are passed as well
   * @throws {Error} - if token, secret or issuer are invalid
   */
  verify(token) {
    return jwt.verify(token, this._secret, {issuer: this._issuer})
  }
}

module.exports = O2WebToken;
