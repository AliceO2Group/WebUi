/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

const { Issuer, generators } = require('openid-client');
const assert = require('assert');
const log = new (require('./../log/Log.js'))('OpenID');

/**
 * Authenticates and authorises users via OpenID Connect (new CERN SSO).
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class OpenId {
  constructor(config) {
    assert(config.id, 'Missing config value: OpenID.id');
    assert(config.secret, 'Missing config value: OpenID.secret');
    assert(config.well_known, 'Missing config value: OpenId.well_known');
    assert(config.redirect_uri, 'Missing config value: OpenId.redirect_uri');
    this.config = config;
    this.code_verifier = generators.codeVerifier();
    this.createIssuer();
  }

  /**
   * Create OpenID client based on well-known endpoint
   */
  createIssuer() {
    Issuer.discover(this.config.well_known)
    .then((issuer) => {
      this.client = new issuer.Client({
        client_id: this.config.id,
        client_secret: this.config.secret,
        redirect_uris: [this.config.redirect_uri],
        response_types: ['code'],
        id_token_signed_response_alg: "RS256",
        token_endpoint_auth_method: "client_secret_basic"
      });
      log.info("OpenID client initalized");
    });
  }

  /**
   * Provides authorization URL
   */
  getAuthUrl(state) {
    const code_challenge = generators.codeChallenge(this.code_verifier);
    return this.client.authorizationUrl({
      scope: 'openid',
      code_challenge,
      code_challenge_method: 'S256',
      state: state
    });
  }

  /**
   * Handles callback
   */
  callback(req) {
    const params = this.client.callbackParams(req);
    delete params.state;
    const checks = {
      code_verifier: this.code_verifier
    };
    return this.client.callback(this.config.redirect_uri, params, checks);
  }
}
module.exports = OpenId;
