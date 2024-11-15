
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

const jwt = require('jsonwebtoken');
const { http, jwt: jwtConfig } = require('./../test-config.js');


/**
 * Provides JSON Web Token functionality such as token generation and verification with `jsonwebtoken` library
 */
const generateToken = (personid, username, name, access = '', secret) => {
  return jwt.sign({ id: personid, username, name, access }, secret, {
    expiresIn: '1d',
    issuer: 'test-gui',
  });
};

const TEST_URL = 'http://' + http.hostname + ':' + http.port;
const ADMIN_TEST_TOKEN = generateToken(0, 'admin', 'Admin User', 'admin', jwtConfig.secret);
const GLOBAL_TEST_TOKEN = generateToken(1, 'global', 'Global User', 'global', jwtConfig.secret);
const DET_MID_TEST_TOKEN = generateToken(2, 'det-mid', 'Detector User', 'det-mid', jwtConfig.secret);
const GUEST_TEST_TOKEN = generateToken(3, 'guest', 'Guest User', 'guest', jwtConfig.secret);

module.exports = {
  ADMIN_TEST_TOKEN,
  GLOBAL_TEST_TOKEN,
  DET_MID_TEST_TOKEN,
  GUEST_TEST_TOKEN,
  TEST_URL,
};

