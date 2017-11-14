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

    this.redirectUri = config.redirect_uri;
    this.userOptions = {
      host: config.resource.hostname,
      port: config.resource.port,
      path: config.resource.userPath
    };
    this.groupOptions = {
      host: config.resource.hostname,
      port: config.resource.port,
      path: config.resource.groupPath
    };
    this.scope = 'https://' + config.resource.hostname + config.resource.userpath;
    this.egroup = config.egroup;
  }

  /**
   * Returns autorization URL
   * @param {string} state - Base64 encoded parameters
   * @return {object} authorizeURL
   */
  getAuthorizationUri(state) {
    return this.oauthCreds.authorizationCode.authorizeURL({
      redirect_uri: this.redirectUri,
      scope: this.scope,
      state: state
    });
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
          return Promise.all([
            this.getDetails(token.token.access_token, this.userOptions),
            this.getDetails(token.token.access_token, this.groupOptions)
          ]);
        }).then((data) => {
          if (data[1].groups.find((group) => group === this.egroup) === undefined) {
            reject(new Error('e-grups restriction'));
          }
          resolve(data);
        }).catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * Provides user details (used by wesocket)
   * @param {string} token oAuth token
   * @return {object} promise of user data
   */
  getUserDetails(token) {
    return this.getDetails(token, this.userOptions);
  }

  /**
   * Queries details using received access token.
   * @param {string} token - OAuth access token
   * @param {object} options POST options
   * @return {object} Promise with user details
   */
  getDetails(token, options) {
    return new Promise((resolve, reject) => {
      const postOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'text',
          'Authorization': 'Bearer ' + token
        }
      };
      Object.assign(postOptions, options);
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
