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
import { deepStrictEqual } from 'node:assert';
import { MOCK_OBJECT_BY_ID_RESULT, OBJECT_BY_PATH_RESULT, OBJECT_VERSIONS,
  OBJECT_VERSIONS_FILTERED_BY_RUN_NUMBER } from '../../setup/seeders/ccdbObjects.js';

export const apiGetObjectsTests = () => {
  suite('GET /object', () => {
    test('should return QCObject details with all versions', async () => {
      await request(`${URL_ADDRESS}/api/object`)
        .get(`?token=${OWNER_TEST_TOKEN}&path=qc/test/object/1`)
        .expect((res) => {
          const { versions } = res.body;
          delete res.body.versions; // versions is checked for individually.
          delete res.body.root;

          deepStrictEqual(res.body, OBJECT_BY_PATH_RESULT, 'Unexpected response');
          deepStrictEqual(versions, OBJECT_VERSIONS, 'Versions do not match up');
        });
    });

    test('should return QCObject versions if a filter is added', async () => {
      await request(`${URL_ADDRESS}/api/object`)
        .get(`?token=${OWNER_TEST_TOKEN}&path=qc/test/object/1&filters[RunNumber]=0`)
        .expect((res) => {
          const { versions } = res.body;
          delete res.body.versions; // versions is checked for individually.
          delete res.body.root;

          deepStrictEqual(res.body, OBJECT_BY_PATH_RESULT, 'Unexpected response');
          deepStrictEqual(versions, OBJECT_VERSIONS_FILTERED_BY_RUN_NUMBER, 'Versions do not match up');
        });
    });
  });

  suite('GET /object/:id', () => {
    test('should return QCObject details with all versions', async () => {
      await request(`${URL_ADDRESS}/api/object/6724a6bd1b2bad3d713cc4ee`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect((res) => {
          const { versions } = res.body;
          delete res.body.versions; // versions is checked for individually.
          delete res.body.root;

          deepStrictEqual(res.body, MOCK_OBJECT_BY_ID_RESULT, 'Unexpected response');
          deepStrictEqual(versions, OBJECT_VERSIONS, 'Versions do not match up');
        });
    });

    test('should return QCObject versions if a filter is added.', async () => {
      await request(`${URL_ADDRESS}/api/object/6724a6bd1b2bad3d713cc4ee`)
        .get(`?token=${OWNER_TEST_TOKEN}&filters[RunNumber]=0`)
        .expect((res) => {
          const { versions } = res.body;
          delete res.body.versions;
          delete res.body.root;

          deepStrictEqual(res.body, MOCK_OBJECT_BY_ID_RESULT, 'Unexpected response');
          deepStrictEqual(versions, OBJECT_VERSIONS_FILTERED_BY_RUN_NUMBER, 'Versions do not match up');
        });
    });
  });

  suite('GET /objects', () => {

  });
};
