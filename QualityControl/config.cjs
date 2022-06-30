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

  listingConnector: 'ccdb', // ccdb or mysql or amore (default mysql) for listing objects

  ccdb: {
    hostname: 'ccdb-test.cern.ch',
    // hostname: 'ali-qcdb-gpn.cern.ch',
    port: 8080,
    // port: 8083,
    prefix: 'qc/ITS/MO/',
    // prefix: 'qc/MFT/MO/MFTReadoutTask/mSummaryChipError'
    // prefix: 'qc/',
    // prefix: 'qc/'
  },

  consul: {
    hostname: 'guis-qc.cern.ch',
    port: 8500,
    refreshRate: {
      min: 10,
      max: 120
    }
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
