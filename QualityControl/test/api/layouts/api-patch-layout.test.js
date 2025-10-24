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
    test('should return a 404 error if the id of the layout is not provided', async () => {
      await request(`${URL_ADDRESS}/api/layout/`)
        .patch(`?token=${GLOBAL_TEST_TOKEN}`)
        .expect(404, {
          error: '404 - Page not found',
          message: 'The requested URL was not found on this server.',
        });
    });

    //if not enough permissions
    test('should return a 403 error if the requestor is not allowed to edit', async () => {
      await request(`${URL_ADDRESS}/api/layout/1`)
        .patch(`?token=${OWNER_TEST_TOKEN}`)
        .expect(403, {
          message: 'Not enough permissions for this operation',
          status: 403,
          title: 'Unauthorized Access',
        });
    });

    //if body is not provided
    test('should return a 400 error if the body is not provided', async () => {
      await request(`${URL_ADDRESS}/api/layout/1`)
        .patch(`?token=${GLOBAL_TEST_TOKEN}`)
        .expect(400, {
          message: 'No layout data provided in the request body',
          status: 400,
          title: 'Invalid Input',
        });
    });

    test('should return a 400 error if invalid body', async () => {
      await request(`${URL_ADDRESS}/api/layout/1`)
        .patch(`?token=${GLOBAL_TEST_TOKEN}`)
        .send({
          test: 'test',
        })
        .expect(400, {
          message: 'Failed to validate layout patch: "test" is not allowed',
          status: 400,
          title: 'Invalid Input',
        });
    });

    //if the id does not exist
    test('should return a 404 error if the id of the layout does not exist', async () => {
      await request(`${URL_ADDRESS}/api/layout/9999`)
        .patch(`?token=${GLOBAL_TEST_TOKEN}`)
        .send({
          isOfficial: true,
        })
        .expect(404, {
          message: 'Layout with id 9999 not found',
          status: 404,
          title: 'Not Found',
        });
    });

    //200 response
    test('should return a 200 response with the id of the updated layout', async () => {
      await request(`${URL_ADDRESS}/api/layout/2`)
        .patch(`?token=${GLOBAL_TEST_TOKEN}`)
        .send({
          isOfficial: true,
        })
        .expect(200)
        .then((response) => {
          if (!response.body.id || response.body.id !== 2) {
            throw new Error('Response does not contain the correct layout id');
          }
        });
    });
  });
};
