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
import { strictEqual, deepStrictEqual } from 'node:assert';
import { OWNER_TEST_TOKEN, URL_ADDRESS } from '../config.js';
import request from 'supertest';
import { RunStatus } from '../../../common/library/runStatus.enum.js';

export const apiGetRunStatusTests = () => {
  suite('GET /filter/run-status/:runNumber', () => {
    test('should return run status for valid run number', async () => {
      const runNumber = '123';
      await request(`${URL_ADDRESS}/api/filter/run-status/${runNumber}`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect(200)
        .expect((res) => {
          if (!Object.values(RunStatus).includes(res.body)) {
            throw new Error(`Expected valid run status, got: ${res.body}`);
          }
          strictEqual(res.body, RunStatus.NOT_FOUND);
        });
    });

    test('should return 400 error for invalid run number format', async () => {
      const invalidRunNumber = 'invalid-run-number';
      await request(`${URL_ADDRESS}/api/filter/run-status/${invalidRunNumber}`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect(400)
        .expect((res) => {
          deepStrictEqual(res.body, {
            status: 400,
            title: 'Invalid Input',
            message: 'Run number must be a valid number',
          });
        });
    });

    test('should return 400 error for negative run number', async () => {
      const negativeRunNumber = '-123';
      await request(`${URL_ADDRESS}/api/filter/run-status/${negativeRunNumber}`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect(400)
        .expect((res) => {
          deepStrictEqual(res.body, {
            status: 400,
            title: 'Invalid Input',
            message: 'Run number must be an integer greater than or equal to 0',
          });
        });
    });
  });
};
