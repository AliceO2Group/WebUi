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
 * Provides JSON Web Token functionality such as token generation and verification.
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class JwtToken {
  /**
   * Stores secret
   * @constructor
   * @param {object} config - cofiguration object
   */
  constructor(config) {
    config = (typeof config == 'undefined') ? {} : config;
    config.expiration = (!config.expiration) ? '1d' : config.expiration;
    config.issuer = (!config.issuer) ? 'o2-ui' : config.issuer;
    config.maxAge = (!config.maxAge) ? '7d' : config.maxAge;
    config.secret = (!config.secret) ? randomBytes(4).toString('hex') : config.secret;
    
    this._expiration = config.expiration;
    this._maxAge = config.maxAge;
    this._secret = config.secret;
    this._issuer = config.issuer;
  }

  /**
   * Generates encrypted token with user id and access level.
   * Sets expiration time and sings it using secret.
   * @param {number} personid - CERN user id
   * @param {string} username - CERN username
   * @param {number} access - level of access
   * @return {object} generated token
   */
  generateToken(personid, username, name, access = '') {
    const payload = {id: personid, username: username, name: name, access: access};
    const token = jwt.sign(payload, this._secret, {
      expiresIn: this._expiration,
      issuer: this._issuer
    });
    return token;
  }

  /**
   * When the token expires, this method allows to refresh it.
   * It skips expiration check and verifies (already expired) token based on maxAge parameter
   * (maxAge >> expiration).
   * Then it creates a new token using parameters of the old one and ships it to the user.
   * If maxAge timeouts, the user needs to re-login via OAuth.
   * @param {object} token - expired token
   * @return {object} new token or false in case of failure
   * @deprecated
   */
  refreshToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this._secret, {
        issuer: this._issuer,
        ignoreExpiration: true,
        maxAge: this._maxAge
      }, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          decoded.newToken = this.generateToken(decoded.id, decoded.username, decoded.name, decoded.access);
          resolve(decoded);
        }
      });
    });
  }

  /**
   * Decrypts user token to verify that is vaild.
   * @param {object} token - token to be verified
   * @return {object} whether operation was successful, if so decoded data are passed as well
   */
  verify(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this._secret, {issuer: this._issuer}, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
  }
}
module.exports = JwtToken;
