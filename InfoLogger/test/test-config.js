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
  http: {
    port: 8080,
    // portSecure: 8443,
    hostname: 'localhost',
    // key: './cert/key.pem',
    // cert: './cert/cert.pem',
    tls: false
  },
  infoLoggerServer: {
    host: 'localhost',
    port: 6102
  },
  mysql: {
    host: 'localhost',
    port: 6103,
    database: 'INFOLOGGER'
  },
  jwt: {
    secret: '<secret>',
    issuer: 'alice-o2-gui',
    expiration: '60s',
    maxAge: '2'
  },
  dbFile: './test/testdb.json'
};
