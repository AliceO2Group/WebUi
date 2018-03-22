module.exports = {
  jwt: {
    secret: '<secret>',
    issuer: 'alice-o2-gui',
    expiration: '1d',
    maxAge: '1d'
  },
  oAuth: {
    secret: '<oauth secret>',
    id: '<oauth name>',
    tokenHost: 'https://oauth.web.cern.ch',
    tokenPath: '/OAuth/Token',
    authorizePath: '/OAuth/Authorize',
    redirect_uri: 'https://<Gui url>/callback',
    scope: 'https://oauthresource.web.cern.ch/api/User',
    state: '3(#0/!~',
    egroup: 'alice-member',
    resource: {
      hostname: 'oauthresource.web.cern.ch',
      userPath: '/api/User',
      groupPath: '/api/Groups',
      port: 443
    }
  },
  http: {
    port: 8080,
    portSecure: 8443,
    hostname: 'vcap.me',
    key: './cert/key.pem',
    cert: './cert/cert.pem',
    tls: true
  },
  tobject2json: {
    endpoint: 'tcp://127.0.0.1:5555' // zmq endpoint
  }
};
