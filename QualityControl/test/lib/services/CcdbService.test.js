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

/* eslint-disable require-jsdoc */
/* eslint-disable max-len */

import { deepStrictEqual, strictEqual, rejects } from 'node:assert';
import { suite, test, before } from 'node:test';
import nock from 'nock';

import { CcdbService } from '../../../lib/services/ccdb/CcdbService.js';
import { CCDB_MONITOR, CCDB_VERSION_KEY } from '../../../lib/services/ccdb/CcdbConstants.js';

const ccdbConfig = {
  hostname: 'ccdb-local',
  port: 8083,
  protocol: 'https',
  prefix: 'qc-test',
}

export const ccdbServiceTestSuite = async () => {
  suite('CCDB Test Suite - ', () => {
    before(() => nock.cleanAll());
    
    suite('Creating a new CcdbService instance', () => {
      test('should successfully initialize CcdbService', () => {
        const ccdbService = new CcdbService({ hostname: 'ccdb-local', port: 8083, protocol: 'https', prefix: 'qc/' });

        strictEqual(ccdbService._hostname, 'ccdb-local');
        strictEqual(ccdbService._port, 8083);
        strictEqual(ccdbService._protocol, 'https');
        strictEqual(ccdbService.PREFIX, 'qc');
      });

      test('should successfully initialize CcdbService with default values', () => {
        const ccdbService = new CcdbService();

        strictEqual(ccdbService._hostname, 'localhost');
        strictEqual(ccdbService._port, 8080);
        strictEqual(ccdbService._protocol, 'http');
        strictEqual(ccdbService.PREFIX, 'qc');
      });

      test('should successfully setup CcdbService', () => {
        const ccdbService = CcdbService.setup({ hostname: 'ccdb-local', port: 8083, protocol: 'https', prefix: 'qc/' });

        strictEqual(ccdbService._hostname, 'ccdb-local');
        strictEqual(ccdbService._port, 8083);
        strictEqual(ccdbService._protocol, 'https');
        strictEqual(ccdbService.PREFIX, 'qc');
      });
    });

    suite('`getVersion()` tests', () => {
      let ccdb;
      let CCDB_URL_HEALTH_POINT = '';
      let CCDB_HOSTNAME = '';
      before(() => {
        ccdb = new CcdbService(ccdbConfig);
        CCDB_URL_HEALTH_POINT = `/monitor/${CCDB_MONITOR}/.*/${CCDB_VERSION_KEY}`;
        CCDB_HOSTNAME = ccdbConfig.hostname;
      });

      test('should successfully test connection to CCDB', async () => {
        const response = {};
        response[CCDB_MONITOR] = {};
        response[CCDB_MONITOR][CCDB_HOSTNAME] = [{ param: 'ccdb_version', updated: 1690295929225, value: '1.0.27' }];

        nock('http://ccdb-local:8083')
          .get(CCDB_URL_HEALTH_POINT)
          .reply(200, response);

        const info = await ccdb.getVersion();
        deepStrictEqual(info, { version: '1.0.27' });
      });

      test('should return rejected promise when attempting to test connection on CCDB', async () => {
        nock('http://ccdb-local:8083')
          .get(CCDB_URL_HEALTH_POINT)
          .replyWithError('getaddrinfo ENOTFOUND ccdb ccdb-local:8083');
        await rejects(async () => await ccdb.getVersion(), new Error('Unable to connect to CCDB due to: Error: getaddrinfo ENOTFOUND ccdb ccdb-local:8083'));
      });
    });

    suite('`getObjectsLatestVersionList()` tests', () => {
      test('should reject with error for fields parameter not being a list', async () => {
        const ccdb = new CcdbService(ccdbConfig);
        await rejects(
          async () => await ccdb.getObjectsLatestVersionList('/qc', 'bad-fields'),
          new TypeError('fields.join is not a function'),
        );
      });

      test('should successfully return a list of the objects with requested default headers', async () => {
        const ccdb = new CcdbService(ccdbConfig);
        const objects = [
          { path: 'object/one', Created: '101', 'Last-Modified': '102' },
          { path: 'object/two', Created: '101', 'Last-Modified': '102' },
          { path: 'object/three', Created: '101', 'Last-Modified': '102' },
        ];
        nock('http://ccdb-local:8083', {
          reqheaders: {
            Accept: 'application/json',
            'X-Filter-Fields': 'path,Created,Last-Modified',
          },
        })
          .get(`/latest/${ccdbConfig.prefix}.*`)
          .reply(200, { objects, subfolders: [] });
        const objectsRetrieved = await ccdb.getObjectsLatestVersionList();
        deepStrictEqual(objectsRetrieved, objects, 'Received objects are not alike');
      });

      test('should successfully return a list of the objects with specified headers', async () => {
        const ccdb = new CcdbService(ccdbConfig);
        const objects = [
          { path: 'object/one', Created: '101', 'Last-Modified': '102', Id: 1 },
          { path: 'object/two', Created: '101', 'Last-Modified': '102', Id: 2 },
          { path: 'object/three', Created: '101', 'Last-Modified': '102', Id: 3 },
        ];
        nock('http://ccdb-local:8083', {
          reqheaders: {
            Accept: 'application/json',
            'X-Filter-Fields': 'Id',
          },
        })
          .get('/latest/.*')
          .reply(200, { objects: objects, subfolders: [] });
        const objectsRetrieved = await ccdb.getObjectsLatestVersionList('', ['Id']);
        deepStrictEqual(objectsRetrieved, objects, 'Received objects are not alike');
      });

      test('should reject due to HTTP request error', async () => {
        const ccdb = new CcdbService(ccdbConfig);
        const error = new Error('Querying service is down');
        nock('http://ccdb-local:8083')
          .get(`/latest/${ccdbConfig.prefix}.*`)
          .replyWithError(error);
        await rejects(async () => await ccdb.getObjectsLatestVersionList(), new Error(`${error.message || error}`));
      });
    });

    suite('`getObjectVersions()` tests', () => {
      test('should successfully return a list of versions for a specific object', async () => {
        const ccdb = new CcdbService(ccdbConfig);
        const objects = [
          { path: 'object/one', Created: '101', 'Valid-From': '102', ETag: 'id102', metadata: [] },
          { path: 'object/one', Created: '101', 'Valid-From': '103', ETag: 'id103', metadata: [] },
          { path: 'object/one', Created: '101', 'Valid-From': '104', ETag: 'id104', metadata: [] },
        ];
        const expectedVersions = [{ 'Valid-From': 102, Created: 101, ETag: 'id102' }, { 'Valid-From': 103, Created: 101, ETag: 'id103' }, { 'Valid-From': 104, Created: 101, ETag: 'id104' }];
        nock('http://ccdb-local:8083')
          .get('/browse/object/one')
          .reply(200, { objects, subfolders: [] });

        const result = await ccdb.getObjectVersions({ path: 'object/one' });
        deepStrictEqual(result, expectedVersions);
      });

      test('should successfully return an empty list due to empty reply from CCDB', async () => {
        const ccdb = new CcdbService(ccdbConfig);
        nock('http://ccdb-local:8083')
          .get('/browse/object/one')
          .reply(200, { objects: [], subfolders: [] });

        const result = await ccdb.getObjectVersions({ path: 'object/one' });
        deepStrictEqual(result, []);
      });
    });

    suite('`getObjectLatestVersionInfo()` tests', () => {
      test('should throw error if path for object to be queried is not provided', async () => {
        const ccdb = new CcdbService(ccdbConfig);
        await rejects(
          async () => await ccdb.getObjectLatestVersionInfo(),
          new Error('Missing mandatory parameter: path'),
        );
        await rejects(
          async () => await ccdb.getObjectLatestVersionInfo(null),
          new Error('Missing mandatory parameter: path'),
        );
        await rejects(
          async () => await ccdb.getObjectLatestVersionInfo(undefined),
          new Error('Missing mandatory parameter: path'),
        );

        await rejects(
          async () => await ccdb.getObjectLatestVersionInfo({ path: undefined }),
          new Error('Missing mandatory parameter: path'),
        );
      });

      test('should throw error if data service rejected the request', async () => {
        const ccdb = new CcdbService(ccdbConfig);
        nock('http://ccdb-local:8083')
          .get('/latest/object/one/')
          .reply(502, 'Unable to find object');

        await rejects(
          async () => await ccdb.getObjectLatestVersionInfo({ path: 'object/one' }),
          new Error('Unable to retrieve object for: object/one'),
        );
      });

      test('should throw error if received object is not valid', async () => {
        const ccdb = new CcdbService(ccdbConfig);
        const objects = [{ Created: '101', 'Last-Modified': '102', id: 'id', metadata: [] }];
        nock('http://ccdb-local:8083')
          .get('/latest/object/one/')
          .reply(200, { objects, subfolders: [] });

        await rejects(
          async () => await ccdb.getObjectLatestVersionInfo({ path: 'object/one' }),
          new Error('Unable to retrieve object for: object/one'),
        );
      });

      test('should successfully return a valid object', async () => {
        const ccdb = new CcdbService(ccdbConfig);
        const objects = [{ path: 'object/one', Created: '101', 'Last-Modified': '102', id: 'id', metadata: [] }];
        nock('http://ccdb-local:8083')
          .get('/latest/object/one')
          .reply(200, { objects, subfolders: [] });

        const result = await ccdb.getObjectLatestVersionInfo({ path: 'object/one' });
        deepStrictEqual(result, objects[0]);
      });
    });

    suite('`getObjectDetails()` tests', () => {
      let ccdb;
      before(() => {
        ccdb = new CcdbService(ccdbConfig);
      });

      test('should throw error due to missing mandatory parameters (path, timestamp, id)', async () => {
        await rejects(async () => ccdb.getObjectDetails(), new Error('Missing mandatory parameters: path & validFrom'));
        await rejects(async () => ccdb.getObjectDetails(null), new Error('Missing mandatory parameters: path & validFrom'));
        await rejects(async () => ccdb.getObjectDetails(undefined), new Error('Missing mandatory parameters: path & validFrom'));
        await rejects(async () => ccdb.getObjectDetails({ path: '' }), new Error('Missing mandatory parameters: path & validFrom'));
        await rejects(async () => ccdb.getObjectDetails({ path: null, validFrom: 213 }, null), new Error('Missing mandatory parameters: path & validFrom'));
      });

      test('should successfully return content-location field on status >=200 <= 399', async () => {
        nock('http://ccdb-local:8083')
          .defaultReplyHeaders({ 'content-location': '/download/123123-123123', location: '/download/some-id' })
          .head('/qc/some/test/123455432/id1')
          .reply(303);
        const content = await ccdb.getObjectDetails({ path: 'qc/some/test', validFrom: 123455432, id: 'id1' });
        strictEqual(content.location, '/download/123123-123123');
      });

      test('should successfully return content-location field if is string as array with "alien" second item on status >=200 <= 399', async () => {
        nock('http://ccdb-local:8083')
          .defaultReplyHeaders({ 'content-location': '/download/123123-123123, alien://', location: '/download/some-id' })
          .head('/qc/some/test/123455432/id1')
          .reply(200);
        const content = await ccdb.getObjectDetails({ path: 'qc/some/test', validFrom: 123455432, id: 'id1' });
        strictEqual(content.location, '/download/123123-123123');
      });

      test('should successfully return content-location field if is string as array with "alien" first item and "location" second on status >=200 <= 399', async () => {
        nock('http://ccdb-local:8083')
          .defaultReplyHeaders({ 'content-location': 'alien://, file/some/object, /download/123123-123123', location: '/download/some-id' })
          .head('/qc/some/test/123455432/id1')
          .reply(303);
        const content = await ccdb.getObjectDetails({ path: 'qc/some/test', validFrom: 123455432, id: 'id1' });
        strictEqual(content.location, '/download/123123-123123');
      });

      test('should successfully return drawing options if present', async () => {
        nock('http://ccdb-local:8083')
          .defaultReplyHeaders({ 'content-location': '/download/some-id', drawoptions: 'colz hep' })
          .head('/qc/some/test/123455432/id1')
          .reply(200);
        const content = await ccdb.getObjectDetails({ path: 'qc/some/test', validFrom: 123455432, id: 'id1' });
        deepStrictEqual(content.drawoptions, 'colz hep');
      });

      test('should successfully return displayHints if present', async () => {
        nock('http://ccdb-local:8083')
          .defaultReplyHeaders({ 'content-location': '/download/some-id', displayhints: 'AP beta' })
          .head('/qc/some/test/123455432/id1')
          .reply(200);
        const content = await ccdb.getObjectDetails({ path: 'qc/some/test', validFrom: 123455432, id: 'id1' });
        deepStrictEqual(content.displayhints, 'AP beta');
      });

      test('should reject with error due to invalid status', async () => {
        nock('http://ccdb-local:8083')
          .head('/qc/some/test/123455432/id1')
          .reply(404);
        await rejects(async () => ccdb.getObjectDetails({ path: 'qc/some/test', validFrom: 123455432, id: 'id1' }), new Error('Unable to retrieve object: qc/some/test due to status: 404'));
      });

      test('should reject with error due no content-location without alien', async () => {
        nock('http://ccdb-local:8083')
          .defaultReplyHeaders({ 'content-location': 'alien/some-id' })
          .head('/qc/some/test/123455432/id1')
          .reply(200);
        await rejects(async () => ccdb.getObjectDetails({ path: 'qc/some/test', validFrom: 123455432, id: 'id1' }), new Error('No location provided by CCDB for object with path: qc/some/test'));
      });

      test('should reject with empty content-location', async () => {
        nock('http://ccdb-local:8083')
          .defaultReplyHeaders({ 'content-location': '' })
          .head('/qc/some/test/123455432/id1')
          .reply(200);
        await rejects(async () => ccdb.getObjectDetails({ path: 'qc/some/test', validFrom: 123455432, id: 'id1' }), new Error('No location provided by CCDB for object with path: qc/some/test'));
      });

      test('should reject with missing content-location', async () => {
        nock('http://ccdb-local:8083')
          .defaultReplyHeaders({ 'content-location': '' })
          .head('/qc/some/test/123455432/id1')
          .reply(200);
        await rejects(async () => ccdb.getObjectDetails({ path: 'qc/some/test', validFrom: 123455432, id: 'id1' }), new Error('No location provided by CCDB for object with path: qc/some/test'));
      });
    });

    suite('`_parsePrefix()` tests', () => {
      let ccdb;
      before(() => {
        ccdb = new CcdbService(ccdbConfig);
      });

      test('successfully return empty string when no prefix is provided in config object', () => {
        strictEqual(ccdb._parsePrefix(), '');
        strictEqual(ccdb._parsePrefix(undefined), '');
        strictEqual(ccdb._parsePrefix(''), '');
      });
      test('successfully return prefix with no backslash and no forward slash', () => {
        strictEqual(ccdb._parsePrefix('/qc'), 'qc');
        strictEqual(ccdb._parsePrefix('qc/'), 'qc');
        strictEqual(ccdb._parsePrefix('/qc/tst/'), 'qc/tst');
      });
    });

    suite('`_buildCcdbUrlPath()` tests', () => {
      let ccdb;
      before(() => {
        ccdb = new CcdbService(ccdbConfig);
      });

      test('successfully build URL path with partial identification fields only', () => {
        strictEqual(ccdb._buildCcdbUrlPath({ path: 'qc/TPC/object' }), '/qc/TPC/object');
        strictEqual(ccdb._buildCcdbUrlPath({ path: 'qc/TPC/object', validFrom: 1231231231 }), '/qc/TPC/object/1231231231');
        strictEqual(ccdb._buildCcdbUrlPath({ path: 'qc/TPC/object', validUntil: 1231231231 }), '/qc/TPC/object/1231231231');
        strictEqual(ccdb._buildCcdbUrlPath({ path: 'qc/TPC/object', validFrom: 12322222, validUntil: 1231231231 }), '/qc/TPC/object/12322222/1231231231');
        strictEqual(ccdb._buildCcdbUrlPath({ path: 'qc/TPC/object', validFrom: 12322222, id: '123-ffg' }), '/qc/TPC/object/12322222/123-ffg');
        strictEqual(ccdb._buildCcdbUrlPath({ path: 'qc/TPC/object', validFrom: 12322222, validUntil: 123332323, id: '123-ffg' }), '/qc/TPC/object/12322222/123332323/123-ffg');
      });

      test('successfully build URL path with complete identification fields only', () => {
        const identification = {
          path: 'qc/TPC/object',
          validFrom: 12322222,
          validUntil: 123332323,
          id: '123-ffg',
          filters: {
            RunNumber: '123456',
            PartName: 'Pass',
          },
        };
        strictEqual(ccdb._buildCcdbUrlPath(identification), '/qc/TPC/object/12322222/123332323/123-ffg/RunNumber=123456/PartName=Pass');
      });
    });
  });
};
