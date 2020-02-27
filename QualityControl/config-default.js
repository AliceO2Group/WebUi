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

  listingConnector: 'ccdb', // ccdb or mysql or amore (default mysql) for listing objects

  ccdb: {
    hostname: 'localhost',
    port: 8080
  },

  consul: {
    hostname: 'localhost',
    port: 8500
  }

  // dbFile: '/var/db/qcg-db.json', // absolute path where to save layouts, default = root of this app

  // JWT manages user's session duration
  // https://github.com/AliceO2Group/WebUi/blob/dev/Framework/docs/guide/json-tokens.md
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

  // amore: {
  //   host: '<mysql host>',
  //   user: '<login>',
  //   password: '<pwd>',
  //   database: 'AMORE'
  // }
};
