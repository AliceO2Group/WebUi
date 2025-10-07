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
import { OWNER_TEST_TOKEN, URL_ADDRESS } from '../config.js';
import request from 'supertest';
import { deepStrictEqual, strictEqual } from 'node:assert';

export const apiGetLayoutsTests = () => {
  suite('GET /layouts', () => {
    test('should return all layouts when no filters are provided', async () => {
      await request(`${URL_ADDRESS}/api/layouts`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect(200)
        .expect((res) => {
          if (!Array.isArray(res.body)) {
            throw new Error('Expected array of layouts');
          }
          if (res.body.length < 2) {
            throw new Error(`Expected at least 3 layouts ${res.body.length}`);
          }
        });
    });

    test('should return layouts filtered by owner_id', async () => {
      const ownerId = 0;
      await request(`${URL_ADDRESS}/api/layouts`)
        .get(`?token=${OWNER_TEST_TOKEN}&owner_id=${ownerId}`)
        .expect(200)
        .expect((res) => {
          res.body.forEach((layout) => {
            strictEqual(layout.owner_id, ownerId, `Expected layout owner_id to be ${ownerId}`);
          });
        });
    });

    test('should return specific fields when fields parameter is provided', async () => {
      const fields = 'name,owner_id';
      await request(`${URL_ADDRESS}/api/layouts`)
        .get(`?token=${OWNER_TEST_TOKEN}&fields=${fields}`)
        .expect(200)
        .expect((res) => {
          if (!Array.isArray(res.body)) {
            throw new Error('Expected array of layouts');
          }
          res.body.forEach((layout) => {
            const hasName = Object.prototype.hasOwnProperty.call(layout, 'name');
            const hasOwnerId = Object.prototype.hasOwnProperty.call(layout, 'owner_id');
            if (Object.keys(layout).length !== 2 || !hasName || !hasOwnerId) {
              throw new Error(`Expected only name and owner_id fields but instead got: ${Object.keys(layout)}`);
            }
          });
        });
    });

    test('should return 400 for invalid query parameters', async () => {
      await request(`${URL_ADDRESS}/api/layouts`)
        .get(`?token=${OWNER_TEST_TOKEN}&invalid_param=value`)
        .expect(400, {
          message: 'Invalid query parameters: "invalid_param" is not allowed',
          status: 400,
          title: 'Invalid Input' });
    });
  });

  suite('GET /layout/:id', () => {
    test('should return a single layout by id', async () => {
      const layoutId = '671b8c22402408122e2f20dd';
      await request(`${URL_ADDRESS}/api/layout/${layoutId}`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect(200)
        .expect((res) => {
          deepStrictEqual(res.body.id, layoutId, 'Unexpected Layout structure was returned');
        });
    });

    test('should return 404 when layout is not found', async () => {
      const nonExistentId = 'nonexistent123';
      await request(`${URL_ADDRESS}/api/layout/${nonExistentId}`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect(404, { message: `Layout with id: ${nonExistentId} was not found`, status: 404, title: 'Not Found' });
    });
  });

  suite('GET /layout?name=', () => {
    test('should return layout by name', async () => {
      const layoutName = 'a-test';
      await request(`${URL_ADDRESS}/api/layout`)
        .get(`?token=${OWNER_TEST_TOKEN}&name=${layoutName}`)
        .expect(200)
        .expect((res) => {
          deepStrictEqual(res.body.name, layoutName, 'Unexpected Layout structure was returned');
        });
    });

    test('should return layout by runDefinition', async () => {
      const runDefinition = 'SYNTHETIC';
      await request(`${URL_ADDRESS}/api/layout`)
        .get(`?token=${OWNER_TEST_TOKEN}&runDefinition=${runDefinition}`)
        .expect(200)
        .expect((res) => deepStrictEqual(
          res.body.name,
          runDefinition,
          'Unexpected Layout structure was returned',
        ));
    });
    test('should return layout by runDefinition and pdpBeamType combination', async () => {
      const runDefinition = 'SYNTHETIC';
      const pdpBeamType = 'proton-proton';
      await request(`${URL_ADDRESS}/api/layout`)
        .get(`?token=${OWNER_TEST_TOKEN}&runDefinition=${runDefinition}&pdpBeamType=${pdpBeamType}`)
        .expect(200)
        .expect((res) => deepStrictEqual(
          res.body.name,
          `${runDefinition}_${pdpBeamType}`,
          'Unexpected Layout structure was returned',
        ));
    });

    test('should return 400 when no query parameters are provided', async () => {
      await request(`${URL_ADDRESS}/api/layout`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect(400, { message: 'Missing query parameters', status: 400, title: 'Invalid Input' });
    });

    test('should return 404 when layout is not found', async () => {
      const nonExistentName = 'nonexistent-layout';
      await request(`${URL_ADDRESS}/api/layout`)
        .get(`?token=${OWNER_TEST_TOKEN}&name=${nonExistentName}`)
        .expect(404, {
          message: `Layout with name: ${nonExistentName} was not found`,
          status: 404,
          title: 'Not Found',
        });
    });
  });
};
