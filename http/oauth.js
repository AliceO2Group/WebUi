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
   * Verify with the oAuth server that the code parameter is valid.
   * Retrive some user's information from resource server.
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
        }).then((result) => {
          const details = {
            user: result[0],
            group: result[1]
          };

          // E-group authorization (verify that user is subscribed to the e-group)
          if (!details.group.groups.find((group) => group === this.egroup)) {
            reject(new Error('e-groups restriction'));
          }

          resolve(details);
        }).catch((error) => {
          reject(error);
        });
    });
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
      const req = https.request(postOptions, (res) => {
        res.on('data', (chunk) => {
          response.push(chunk);
        }).on('end', () => {
          if (res.statusCode === 200) {
            let userdata = JSON.parse(response.join(''));
            userdata.oauth = token;
            resolve(userdata);
          } else {
            reject(new Error(res.statusMessage));
          }
        }).on('error', (err) => {
          reject(err);
        });
      });

      req.on('error', (err) => {
        reject(err);
      });
      req.end();
    });
  }
}
module.exports = OAuth;
