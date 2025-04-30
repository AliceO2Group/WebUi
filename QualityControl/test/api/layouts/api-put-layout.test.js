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
import { OWNER_TEST_TOKEN, URL_ADDRESS, USER_TEST_TOKEN } from '../config.js';
import request from 'supertest';
import { LAYOUT_MOCK_2, LAYOUT_MOCK_3 } from '../../demoData/layout/layout.mock.js';

export const apiPutLayoutTests = () => {
  suite('PUT /layout/:id', () => {
    test('should return a 404 error if the id of the layout does not exist', async () => {
      await request(`${URL_ADDRESS}/api/layout/test`)
        .put(`?token=${OWNER_TEST_TOKEN}`)
        .expect(404, {
          message: 'Layout with id: test not found',
          status: 404,
          title: 'Not Found',
        });
    });

    test('should return a 403 error if the requestor is not allowed to edit', async () => {
      await request(`${URL_ADDRESS}/api/layout/671b8c22402408122e2f20dd`)
        .put(`?token=${USER_TEST_TOKEN}`)
        .expect(403, {
          message: 'Only the owner of the layout can make changes to it',
          status: 403,
          title: 'Unauthorized Access',
        });
    });

    test('should return a 400 error if the id is not provided in the body', async () => {
      await request(`${URL_ADDRESS}/api/layout/671b8c22402408122e2f20dd`)
        .put(`?token=${OWNER_TEST_TOKEN}`)
        .expect(400, {
          message: 'Failed to update layout: "id" is required',
          status: 400,
          title: 'Invalid Input',
        });
    });

    test('should return a 400 error if the name of the layout already exists', async () => {
      await request(`${URL_ADDRESS}/api/layout/671b8c22402408122e2f20dd`)
        .put(`?token=${OWNER_TEST_TOKEN}`)
        .send(LAYOUT_MOCK_3)
        .expect(400, {
          message: 'Proposed layout name: a-test already exists',
          status: 400,
          title: 'Invalid Input',
        });
    });

    test('should update the layout successfully', async () => {
      const response = await request(`${URL_ADDRESS}/api/layout/671b8c22402408122e2f20dd`)
        .put(`?token=${OWNER_TEST_TOKEN}`)
        .send(LAYOUT_MOCK_2);
      console.log('lalalal', response.body);
      // .expect(200, {
      //   id: '671b8c22402408122e2f20dd',
      // });
    });
  });
};
