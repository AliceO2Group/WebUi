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

export const config = {
  demoData: false,

  http: {
    port: 8080,
    // PortSecure: 8443,
    hostname: 'localhost',

    /*
     * Key: './cert/key.pem',
     * cert: './cert/cert.pem',
     */
    tls: false,
  },

  ccdb: {
    protocol: 'http',
    hostname: 'localhost',
    port: 8080,
    prefix: 'qc',
    cachePrefix: 'qc',
    cacheRefreshRate: 120 * 1000,
  },
  qc: {
    enabled: false,
  },
  database: {
    host: 'database',
    port: 3306,
    username: 'cern',
    password: 'cern',
    database: 'qcg',
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    timezone: '+00:00',
    logging: false,
    retryThrottle: 5000,
    //forceSeed: true, --- ONLY IN DEVELOPMENT ---
    //drop: true, --- ONLY IN DEVELOPMENT ---
  },
  bookkeeping: {
    url: 'http://localhost:4000', // local insance
    token: '<paste a token from bookkeeping here>',
    runTypesRefreshInterval: 15000,
    runStatusRefreshInterval: 30000,
  },
  kafka: {
    enabled: true,
    clientId: 'qcg-client-local',
    consumerGroups: {
      QCG_RUN: 'qcg-run-local'
    },
    brokers: ['localhost:9092'],
  },

  /*
   * Absolute path where to save layouts, default = root of this app
   * dbFile: '/var/db/qcg-db.json'
   */

  /*
   * JWT manages user's session duration
   * https://github.com/AliceO2Group/WebUi/blob/dev/Framework/docs/guide/json-tokens.md
   * jwt: {
   *   secret: '<secret>',
   *   issuer: 'alice-o2-gui',
   *   expiration: '1d',
   *   maxAge: '1d'
   * },
   */

  /*
   * CERN OpenID configuration object
   * openId: {
   *   secret: '<oauth secret>',
   *   id: '<oauth name>',
   *   tokenHost: 'https://oauth.web.cern.ch',
   *   tokenPath: '/OAuth/Token',
   *   authorizePath: '/OAuth/Authorize',
   *   redirect_uri: 'https://<Gui url>/callback',
   *   scope: 'https://oauthresource.web.cern.ch/api/User',
   *   state: '3(#0/!~',
   *   egroup: 'alice-member',
   *   resource: {
   *     hostname: 'oauthresource.web.cern.ch',
   *     userPath: '/api/User',
   *     groupPath: '/api/Groups',
   *     port: 443
   *   }
   * },
   */
};
