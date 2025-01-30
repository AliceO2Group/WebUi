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
import { ADMIN_TEST_TOKEN } from '../../setup/testServerSetup.js';
import request from 'supertest';

export const apiPutLayoutTests = () => {
  suite('PUT /layout/:id', () => {
    test('should return a 404 error if the id of the layout does not exist', async () => {
      await request('localhost:8080/api/layout/test')
        .put(`?token=${ADMIN_TEST_TOKEN}`)
        .expect(404, {
          message: 'layout (test) not found',
          status: 404,
          title: 'Not Found',
        });
    });

    test('should return a 404 error if the layout id is not provided', async () => {
      await request('localhost:8080/api/layout/')
        .put(`?id=${null}&token=${ADMIN_TEST_TOKEN}`)
        .expect(404, {
          message: 'layout id not provided',
          status: 404,
          title: 'Not Found',
        });
    });

    test.skip('should return a 401 error if the user is not the owner of the layout', async () => {

    });
    test.skip('should successfully update a layout', async () => {

    });
  });
};
