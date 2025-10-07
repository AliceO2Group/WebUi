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
import { VALID_LAYOUT_FOR_UPDATE } from '../../demoData/layout/layout.mock.js';

export const apiPutLayoutTests = () => {
  suite('PUT /layout/:id', () => {
    test('should update the layout successfully', async () => {
      await request(`${URL_ADDRESS}/api/layout/${VALID_LAYOUT_FOR_UPDATE.id}`)
        .put(`?token=${OWNER_TEST_TOKEN}`)
        .send(VALID_LAYOUT_FOR_UPDATE)
        .expect(200);
    });
    test('should return 400 for invalid layout ID', async () => {
      await request(`${URL_ADDRESS}/api/layout/invalid-id`)
        .put(`?token=${OWNER_TEST_TOKEN}`)
        .send(VALID_LAYOUT_FOR_UPDATE)
        .expect(404, {
          message: 'Layout with id: invalid-id was not found',
          status: 404,
          title: 'Not Found',
        });
    });
    test('should return 403 if user is not the owner or admin', async () => {
      await request(`${URL_ADDRESS}/api/layout/${VALID_LAYOUT_FOR_UPDATE.id}`)
        .put(`?token=${USER_TEST_TOKEN}`)
        .send(VALID_LAYOUT_FOR_UPDATE)
        .expect(403, {
          message: 'Only the owner of the layout can make changes to this layout',
          status: 403,
          title: 'Unauthorized Access',
        });
    });
    test('should return 400 for invalid layout data', async () => {
      const invalidLayoutData = { ...VALID_LAYOUT_FOR_UPDATE, name: '' }; // name is required
      await request(`${URL_ADDRESS}/api/layout/${VALID_LAYOUT_FOR_UPDATE.id}`)
        .put(`?token=${OWNER_TEST_TOKEN}`)
        .send(invalidLayoutData)
        .expect(400, {
          message: 'Invalid body for update: "name" is not allowed to be empty',
          status: 400,
          title: 'Invalid Input',
        });
    });
  });
};
