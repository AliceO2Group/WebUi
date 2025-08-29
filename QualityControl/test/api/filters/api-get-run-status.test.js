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

import { suite, test } from 'node:test';
import { URL_ADDRESS, OWNER_TEST_TOKEN } from '../config.js';
import request from 'supertest';

export const apiGetRunStatusTests = () => {
  suite('GET /filter/run-status/:runNumber', () => {
    test('should return a 403 error if no authentication token is provided', async () => {
      await request(`${URL_ADDRESS}/api/filter/run-status/123456`)
        .get('')
        .expect(403);
    });

    test('should return a 404 error if run number is not provided', async () => {
      await request(`${URL_ADDRESS}/api/filter/run-status/`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect(404, {
          error: '404 - Page not found',
          message: 'The requested URL was not found on this server.',
        });
    });

    test('should return a 400 error for invalid run number (negative)', async () => {
      await request(`${URL_ADDRESS}/api/filter/run-status/-1`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect(400, {
          message: '"value" must be greater than or equal to 0',
          status: 400,
          title: 'Invalid Input',
        });
    });

    test('should return a 400 error for invalid run number (too large)', async () => {
      await request(`${URL_ADDRESS}/api/filter/run-status/1000000`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect(400, {
          message: '"value" must be less than or equal to 999999',
          status: 400,
          title: 'Invalid Input',
        });
    });

    test('should return a 400 error for invalid run number (not a number)', async () => {
      await request(`${URL_ADDRESS}/api/filter/run-status/invalid`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect(400, {
          message: '"value" must be a number',
          status: 400,
          title: 'Invalid Input',
        });
    });

    test('should successfully get run status for valid run number', async () => {
      await request(`${URL_ADDRESS}/api/filter/run-status/123456`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect(200);
    });
  });
};
