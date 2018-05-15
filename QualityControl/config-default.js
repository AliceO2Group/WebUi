module.exports = {
  // demoData: false,

  http: {
    port: 8080,
    // portSecure: 8443,
    hostname: 'localhost',
    // key: './cert/key.pem',
    // cert: './cert/cert.pem',
    tls: false
  },

  mysql: {
    host: 'localhost',
    user: 'qc_user',
    password: 'qc_user',
    database: 'quality_control'
  },

  tobject2json: {
    host: '127.0.0.1',
    port: 7777
  },

  // jwt: {
  //   secret: '<secret>',
  //   issuer: 'alice-o2-gui',
  //   expiration: '1d',
  //   maxAge: '1d'
  // },

  // oAuth: {
  //   secret: '<oauth secret>',
  //   id: '<oauth name>',
  //   tokenHost: 'https://oauth.web.cern.ch',
  //   tokenPath: '/OAuth/Token',
  //   authorizePath: '/OAuth/Authorize',
  //   redirect_uri: 'https://<Gui url>/callback',
  //   scope: 'https://oauthresource.web.cern.ch/api/User',
  //   state: '3(#0/!~',
  //   egroup: 'alice-member',
  //   resource: {
  //     hostname: 'oauthresource.web.cern.ch',
  //     userPath: '/api/User',
  //     groupPath: '/api/Groups',
  //     port: 443
  //   }
  // },

  informationService: {
    server: {
      host: 'localhost',
      port: 5562,
    },
    publisher: {
      host: 'localhost',
      port: 5561,
    }
  }
};
