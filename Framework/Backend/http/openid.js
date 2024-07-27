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

const { Issuer, generators, custom } = require('openid-client');
const assert = require('assert');
const { LogManager } = require('../log/LogManager');

/**
 * Authenticates and authorizes users via OpenID Connect (new CERN SSO).
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class OpenId {
  /**
   * Sets up OpenID Connect based on passed config
   * @param {object} config - id, secret, well_known, redirect_uri
   */
  constructor(config) {
    assert(config.id, 'Missing config value: id');
    assert(config.secret, 'Missing config value: secret');
    assert(config.well_known, 'Missing config value: well_known');
    assert(config.redirect_uri, 'Missing config value: redirect_uri');
    config.timeout = !config.timeout ? 5000 : config.timeout;
    this.config = config;
    this.code_verifier = generators.codeVerifier();
    custom.setHttpOptionsDefaults({
      timeout: config.timeout,
    });

    this.log = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'framework'}/openid`);
  }

  /**
   * Create OpenID client based on well-known endpoint
   * @return {promise} - promise whether OpenID got initialised successfully
   */
  createIssuer() {
    return new Promise((resolve, reject) => {
      Issuer.discover(this.config.well_known)
        .then((issuer) => {
          this.client = new issuer.Client({
            client_id: this.config.id,
            client_secret: this.config.secret,
            redirect_uris: [this.config.redirect_uri],
            response_types: ['code'],
            id_token_signed_response_alg: 'RS256',
            token_endpoint_auth_method: 'client_secret_basic',
          });
          this.log.info('Client initialised');
          resolve();
        }).catch((error) => {
          this.log.error(`Initialisation failed: ${error}`);
          reject(error);
        });
    });
  }

  /**
   * Provides authorization URL
   * @param {string} state - base64 encoded query params passed by user
   * @return {string} - authorization URL
   */
  getAuthUrl(state) {
    const codeChallenge = generators.codeChallenge(this.code_verifier);
    return this.client.authorizationUrl({
      scope: 'openid',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: state,
    });
  }

  /**
   * Handles callback
   * @param {object} req - callback request object
   * @return {promise} - promise that handles callback path and returns token set
   */
  callback(req) {
    const params = this.client.callbackParams(req);
    delete params.state;
    const checks = {
      code_verifier: this.code_verifier,
    };
    return this.client.callback(this.config.redirect_uri, params, checks);
  }
}

module.exports = OpenId;
