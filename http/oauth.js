const https = require('https');
const oauth2 = require('simple-oauth2');

/**
 * Authenticates users via CERN OAuth 2.0.
 * Gathers user account details.
 * @todo e-group authorization
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class OAuth {
  /**
   * Creates OAuth object based on id and secret stored in config file.
   * @param {object} config - configuration object (see docs for details)
   * @constructor
   */
  constructor(config) {
    this.oauthCreds = oauth2.create({
      client: {
        id: config.id,
        secret: config.secret
      },
      auth: {
        tokenHost: config.tokenHost,
        tokenPath: config.tokenPath,
        authorizePath: config.authorizePath
      }
    });

    this.authorizationUri = this.oauthCreds.authorizationCode.authorizeURL({
      redirect_uri: config.redirect_uri,
      scope: config.scope,
      state: config.state
    });
    this.redirectUri = config.redirect_uri;
    this.postOptions = {
      host: config.resource.hostname,
      port: config.resource.port,
      path: config.resource.path
    };
  }

  /**
   * OAuth redirection callback (called by library).
   * @param {number} code - authorization code to request access token
   * @return {object} Promise with user details and token
   */
  oAuthCallback(code) {
    return new Promise((resolve, reject) => {
      const options = {
        code,
        redirect_uri: this.redirectUri
      };

      this.oauthCreds.authorizationCode.getToken(options)
        .then((result) => {
          return this.oauthCreds.accessToken.create(result);
        }).then((token) => {
          return this.oAuthGetUserDetails(token.token.access_token);
        }).then((user) => {
          resolve(user);
        }).catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * Queries user details using received access token.
   * @param {string} token - OAuth access token
   * @return {object} Promise with user details
   */
  oAuthGetUserDetails(token) {
    return new Promise((resolve, reject) => {
      const postOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'text',
          'Authorization': 'Bearer ' + token
        }
      };
      Object.assign(postOptions, this.postOptions);
      let response = [];
      const postRequest = https.request(postOptions, (res) => {
        res.on('data', (chunk) => response.push(chunk));
        res.on('end', () => {
          if (res.statusCode === 200) {
            let userdata = JSON.parse(response.join(''));
            userdata.oauth = token;
            resolve(userdata);
          } else {
            reject(new Error(res.statusMessage));
          }
        });
        res.on('error', (err) => reject(err));
      });
      postRequest.write('');
      postRequest.end();
    });
  }
}
module.exports = OAuth;
