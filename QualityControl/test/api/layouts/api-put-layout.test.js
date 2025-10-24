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
import { MOCK_UPDATED_LAYOUT } from '../../demoData/layout/layout.mock.js';

export const apiPutLayoutTests = () => {
  suite('PUT /layout/:id', () => {
    const layoutToUpdate = MOCK_UPDATED_LAYOUT;
    delete layoutToUpdate.isOfficial;
    test('should return a 404 error if the id of the layout does not exist', async () => {
      await request(`${URL_ADDRESS}/api/layout/test`)
        .put(`?token=${OWNER_TEST_TOKEN}`)
        .expect(404, {
          message: 'Layout with id: test was not found',
          status: 404,
          title: 'Not Found',
        });
    });

    test('should return a 403 error if the requestor is not allowed to edit', async () => {
      await request(`${URL_ADDRESS}/api/layout/1`)
        .put(`?token=${USER_TEST_TOKEN}`)
        .expect(403, {
          message: 'Only the owner of the layout can delete it',
          status: 403,
          title: 'Unauthorized Access',
        });
    });

    test('should return a 400 error if the body is not provided', async () => {
      await request(`${URL_ADDRESS}/api/layout/2`)
        .put(`?token=${OWNER_TEST_TOKEN}`)
        .expect(400, {
          message: 'No layout data provided in the request body',
          status: 400,
          title: 'Invalid Input',
        });
    });

    //if the id in the path and in the body do not match
    test('should return a 400 error if the id in the path and in the body do not match', async () => {
      const layoutWithDifferentId = { ...layoutToUpdate, id: 'different-id' };
      await request(`${URL_ADDRESS}/api/layout/1`)
        .put(`?token=${OWNER_TEST_TOKEN}`)
        .send(layoutWithDifferentId)
        .expect(400, {
          message: 'Layout ID in the path does not match ID in the body',
          status: 400,
          title: 'Invalid Input',
        });
    });

    test('should return a 400 error if the name of the layout already exists', async () => {
      await request(`${URL_ADDRESS}/api/layout/1`)
        .put(`?token=${OWNER_TEST_TOKEN}`)
        .send({ ...layoutToUpdate, name: 'rundefinition_pdpBeamType' })
        .expect(400, {
          message: 'A layout with the same name already exists.',
          status: 400,
          title: 'Invalid Input',
        });
    });

    test('should update the layout successfully', async () => {
      await request(`${URL_ADDRESS}/api/layout/1`)
        .put(`?token=${OWNER_TEST_TOKEN}`)
        .send(layoutToUpdate)
        .expect(200, {
          id: layoutToUpdate.id,
        });
    });
  });
};
