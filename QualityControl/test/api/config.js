/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file 'COPYING'.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */
import { config } from '../config.js';
import jwt from 'jsonwebtoken';

/**
 * Generates a JSON Web Token (JWT) for a user.
 * @param {string} personid - The unique identifier for the person.
 * @param {string} username - The username of the person.
 * @param {string} name - The name of the person.
 * @param {string} [access=''] - The access level or permissions of the person.
 * @param {string} secret - The secret key used to sign the JWT.
 * @returns {string} The generated JWT.
 */
export const generateToken = (personid, username, name, access = '', secret) => jwt.sign({
  id: personid,
  username,
  name,
  access,
}, secret, {
  expiresIn: '1d',
  issuer: 'test-gui',
});

/**
 * This token is used to authenticate the owner of a layout in test scenarios.
 */
export const OWNER_TEST_TOKEN = generateToken(0, 'anonymous', 'Anonymous', 'owner', config.jwt.secret);

/**
 * This token is used to authenticate a user in test scenarios.
 */
export const USER_TEST_TOKEN = generateToken(1, 'user', 'User', 'user', config.jwt.secret);

/**
 * This token is used to authenticate a user with Global role in test scenarios.
 */
export const GLOBAL_TEST_TOKEN = generateToken(2, 'global', 'Global User', 'global', config.jwt.secret);

/**
 * URL address constructed from the hostname and port
 */
export const URL_ADDRESS = `${config.http.hostname}:${config.http.port}`;
