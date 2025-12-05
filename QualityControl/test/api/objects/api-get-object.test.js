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
import { dirname, join } from 'path';
import fs from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'url';

import { MOCK_OBJECT_BY_ID_RESULT, OBJECT_BY_PATH_RESULT, OBJECT_LATEST_FILTERED_BY_RUN_NUMBER, OBJECT_VERSIONS,
  OBJECT_VERSIONS_FILTERED_BY_RUN_NUMBER, TREE_API_OBJECTS } from '../../setup/seeders/ccdbObjects.js';

export const apiGetObjectsTests = () => {
  suite('GET /object', () => {
    test('should return QCObject details with all versions', async () => {
      const url = `${URL_ADDRESS}/api/object?token=${OWNER_TEST_TOKEN}&path=qc/test/object/1`;
      await testResult(url, 200, OBJECT_BY_PATH_RESULT, OBJECT_VERSIONS);
    });

    test('should return QCObject versions if a filter is added', async () => {
      const url = `${URL_ADDRESS}/api/object?token=${OWNER_TEST_TOKEN}&path=qc/test/object/1&filters[RunNumber]=0`;
      await testResult(url, 200, OBJECT_BY_PATH_RESULT, OBJECT_VERSIONS_FILTERED_BY_RUN_NUMBER);
    });

    test('should return 400 if path parameter is missing', async () => {
      await testResult(`${URL_ADDRESS}/api/object?token=${OWNER_TEST_TOKEN}`, 400, {
        message: 'Invalid query parameters: "path" is required', status: 400, title: 'Invalid Input' });
    });

    test('should return 400 if path parameter is not a string', async () => {
      await testResult(`${URL_ADDRESS}/api/object?token=${OWNER_TEST_TOKEN}&path[]=array`, 400, {
        message: 'Invalid query parameters: "path" must be a string', status: 400, title: 'Invalid Input' });
    });

    test('should return 500 if service fails to retrieve object', async () => {
      const url = `${URL_ADDRESS}/api/object?token=${OWNER_TEST_TOKEN}&path=invalid/path`;
      await testResult(url, 500, {
        message: 'Failed to fetch object at url \'/latest/invalid/path\' and path \'invalid/path\'.',
        status: 500,
        title: 'Unknown Error',
      });
    });
  });

  suite('GET /object/proxy/download/', () => {
    test('should return ROOT details from qcdb', async () => {
      const _filename = fileURLToPath(import.meta.url);
      const _dirname = dirname(_filename);
      const filePath = join(_dirname, '../../demoData/qcdbRoot/TObject_1732326337752.root');
      const readfile = promisify(fs.readFile);
      const testBuffer = await readfile(filePath);
      const testFile = new File([testBuffer], 'TObject_1732326337752.root');

      const objectIds = '95c51d3b-9f64-11f0-bd06-bcb9d03ba1a2';
      const url = `http://${URL_ADDRESS}/api/object/proxy/download/?token=${OWNER_TEST_TOKEN}&objectIds=${objectIds}`;
      const response = await fetch(`${url}`);

      strictEqual(await response.text(), await testFile.text());
    });

    test('should return 400 if objectIds are missing', async () => {
      const url = `http://${URL_ADDRESS}/api/object/proxy/download/?token=${OWNER_TEST_TOKEN}`;
      const response = await fetch(`${url}`);

      strictEqual(response.status, 400);
    });
  });

  suite('GET /object/:id', () => {
    const objectId = '6724a6bd1b2bad3d713cc4ee';

    test('should return QCObject details with all versions', async () => {
      const url = `${URL_ADDRESS}/api/object/${objectId}?token=${OWNER_TEST_TOKEN}`;
      await testResult(url, 200, MOCK_OBJECT_BY_ID_RESULT, OBJECT_VERSIONS);
    });

    test('should return QCObject versions if a filter is added', async () => {
      const url = `${URL_ADDRESS}/api/object/${objectId}?token=${OWNER_TEST_TOKEN}&filters[RunNumber]=0`;
      await testResult(url, 200, MOCK_OBJECT_BY_ID_RESULT, OBJECT_VERSIONS_FILTERED_BY_RUN_NUMBER);
    });

    test('should return error when filter is a string', async () => {
      await testResult(`${URL_ADDRESS}/api/object/${objectId}?token=${OWNER_TEST_TOKEN}&filters=RunNumber=0`, 400, {
        message: 'Invalid query parameters: "filters" must be of type object', status: 400, title: 'Invalid Input' });
    });

    test('should return 400 if ID parameter is missing', async () => {
      await testResult(`${URL_ADDRESS}/api/object/%20?token=${OWNER_TEST_TOKEN}`, 400, {
        message: 'Invalid query parameters: Missing object ID in URL', status: 400, title: 'Invalid Input' });
    });

    test('should return 500 if service fails to retrieve object by ID', async () => {
      await testResult(`${URL_ADDRESS}/api/object/invalid_id?token=${OWNER_TEST_TOKEN}`, 500, {
        message: 'Object with invalid_id could not be found', status: 500, title: 'Unknown Error' });
    });
  });

  suite('GET /objects', () => {
    test('should return object names when no filter is provided', async () => {
      await testResult(`${URL_ADDRESS}/api/objects?token=${OWNER_TEST_TOKEN}`, 200, TREE_API_OBJECTS);
    });

    test('should return detailed objects when filter is provided', async () => {
      const url = `${URL_ADDRESS}/api/objects?token=${OWNER_TEST_TOKEN}&filters[RunNumber]=0`;
      await testResult(url, 200, OBJECT_LATEST_FILTERED_BY_RUN_NUMBER);
    });

    test('should return 400 if prefix is not a string', async () => {
      await testResult(`${URL_ADDRESS}/api/objects?token=${OWNER_TEST_TOKEN}&prefix[]=array`, 400, {
        message: 'Invalid query parameters: "prefix" must be a string', status: 400, title: 'Invalid Input' });
    });

    test('should return 400 if fields is not an array', async () => {
      await testResult(`${URL_ADDRESS}/api/objects?token=${OWNER_TEST_TOKEN}&fields=not_an_array`, 400, {
        message: 'Invalid query parameters: "fields" must be an array', status: 400, title: 'Invalid Input' });
    });
  });
};

/**
 * Unified test helper function
 * @param {string} url - Full URL to test
 * @param {number} expectedStatus - Expected HTTP status code
 * @param {object} expectedBody - Expected response body
 * @param {Array<Objects>} [expectedVersions] - Optional expected versions array (for object tests)
 */
async function testResult(url, expectedStatus, expectedBody, expectedVersions = undefined) {
  const response = await request(url).get('');
  const { versions } = response.body;
  delete response.body.versions;
  delete response.body.root;

  if (expectedVersions) {
    deepStrictEqual(versions, expectedVersions, 'Versions do not match up');
  }

  deepStrictEqual(response.body, expectedBody, 'Unexpected response body');
  strictEqual(response.status, expectedStatus, 'Unexpected status code');
}
