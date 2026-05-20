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

const testConfig = require('./test-config.js');
const { O2TokenService } = require('@aliceo2/web-ui');

/**
 * Generates a JWT token for testing purposes with the given payload
 * @param {object} payload - payload to include in the token
 * @param {number} payload.personid - user's person id
 * @param {string} payload.username - user's username
 * @param {string} payload.name - user's name
 * @param {string} payload.access - user's access rights
 * @returns {string} - generated JWT token
 */
const generateToken = ({ personid, username, name, access }) => {
  const tokenService = new O2TokenService(testConfig.jwt);
  const token = tokenService.generateToken(personid, username, name, access);
  return token;
};

/**
 * Generates a JWT token for testing purposes with shifter access rights
 * @returns {string} - generated JWT token with shifter access rights
 */
const generateShifterAccessToken = () => {
  const payload = {
    personid: 2,
    username: 'testshifter',
    name: 'Test Shifter',
    access: 'shifter,guest',
  };
  return generateToken(payload);
};

/**
 * Generates query parameters for authentication with shifter access rights
 * @returns {string} - query parameters for authentication with shifter access rights
 */
const getShifterAuthQueryParams = () => {
  const shiftToken = generateShifterAccessToken();
  return `personid=2&name=Test Shifter&username=testshifter&access=shifter&token=${shiftToken}`;
};

/**
 * Base URL for the application used in tests, constructed from the test configuration
 * and can be used to navigate to the application in tests
 * @returns {string} - base URL for the application
 */
const baseUrl = `http://${testConfig.http.hostname}:${testConfig.http.port}/`;

/**
 * Generates query parameters for authentication with guest-only access rights (no shifter, no admin)
 * @returns {string} - query parameters for authentication with guest access rights
 */
const getGuestAuthQueryParams = () => {
  const token = generateToken({
    personid: 3,
    username: 'testguest',
    name: 'Test Guest',
    access: 'guest',
  });
  return `personid=3&name=Test Guest&username=testguest&access=guest&token=${token}`;
};

/**
 * Generates query parameters for authentication with both shifter and admin access rights
 * @returns {string} - query parameters for authentication with shifter and admin access rights
 */
const getShifterAdminAuthQueryParams = () => {
  const token = generateToken({
    personid: 4,
    username: 'testshifteradmin',
    name: 'Test Shifter Admin',
    access: 'shifter,admin',
  });
  return `personid=4&name=Test Shifter Admin&username=testshifteradmin&access=shifter,admin&token=${token}`;
};

module.exports = {
  getShifterAuthQueryParams,
  getGuestAuthQueryParams,
  getShifterAdminAuthQueryParams,
  baseUrl,
};
