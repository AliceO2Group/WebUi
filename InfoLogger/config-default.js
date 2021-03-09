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
  // mandatory
  http: {
    port: 8080,
    // portSecure: 8443,
    hostname: 'localhost',
    // key: './cert/key.pem',
    // cert: './cert/cert.pem',
    tls: false
  },

  // optional data source, comment object if not used
  // all options: https://github.com/mysqljs/mysql#connection-options
  mysql: {
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'INFOLOGGER',
    port: 3306,
    timeout: 60000,
    retryMs: 5000
  },

  // optional data source, comment object if not used
  // all options: https://nodejs.org/api/net.html#net_socket_connect_options_connectlistener
  infoLoggerServer: {
    host: 'localhost',
    port: 6102
  },

  // JWT manages user's session duration
  // https://github.com/AliceO2Group/WebUi/blob/dev/Framework/docs/guide/json-tokens.md
  // jwt: {
  //   secret: '<secret>',
  //   issuer: 'alice-o2-gui',
  //   expiration: '1d',
  //   maxAge: '1d'
  // },
};
