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
import { GLOBAL_TEST_TOKEN, OWNER_TEST_TOKEN, URL_ADDRESS } from '../config.js';
import request from 'supertest';

export const apiPatchLayoutTests = () => {
  suite('PATCH /layout/:id', () => {
    test('should return a 404 error if the id of the layout does not exist', async () => {
      await request(`${URL_ADDRESS}/api/layout/`)
        .patch(`?token=${OWNER_TEST_TOKEN}`)
        .expect(404, {
          error: '404 - Page not found',
          message: 'The requested URL was not found on this server.',
        });
    });

    test('should return a 404 error if the id is not provided', async () => {
      await request(`${URL_ADDRESS}/api/layout/test`)
        .patch(`?token=${OWNER_TEST_TOKEN}`)
        .expect(404, {
          message: 'layout (test) not found',
          status: 404,
          title: 'Not Found',
        });
    });

    test('should return a 403 error if role is not enough to update the layout', async () => {
      await request(`${URL_ADDRESS}/api/layout/671b8c22402408122e2f20dd`)
        .patch(`?token=${OWNER_TEST_TOKEN}`)
        .expect(403, {
          message: 'Not enough permissions for this operation',
          status: 403,
          title: 'Unauthorized Access',
        });
    });

    test('should return a 400 error for invalid body', async () => {
      await request(`${URL_ADDRESS}/api/layout/671b8c22402408122e2f20dd`)
        .patch(`?token=${GLOBAL_TEST_TOKEN}`)
        .send({
          test: 'test',
        })
        .expect(400, {
          message: 'Failed to validate layout: "test" is not allowed',
          status: 400,
          title: 'Invalid Input',
        });
    });

    test('should successfully update the layout', async () => {
      await request(`${URL_ADDRESS}/api/layout/671b8c22402408122e2f20dd`)
        .patch(`?token=${GLOBAL_TEST_TOKEN}`)
        .send({
          isOfficial: false,
        })
        .expect(201, {
          id: '671b8c22402408122e2f20dd',
        });
    });
  });
};
