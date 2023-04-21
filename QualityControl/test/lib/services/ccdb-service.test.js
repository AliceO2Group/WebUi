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

import assert from 'assert';
import nock from 'nock';

import { CcdbService } from '../../../lib/services/CcdbService.js';
import { testConfig as config } from '../../test-config.js';

export const ccdbServiceTestSuite = async () => {
  before(() => nock.cleanAll());
  describe('Creating a new CcdbService instance', () => {
    it('should throw an error if configuration object is missing hostname field', () => {
      assert.throws(() => new CcdbService({}), new Error('Empty hostname in CCDB config'));
    });

    it('should throw an error if configuration object is missing port field', () => {
      assert.throws(() => new CcdbService({ hostname: 'localhost' }), new Error('Empty port in CCDB config'));
    });

    it('should throw an error if configuration object is missing port field', () => {
      assert.throws(() => new CcdbService({ hostname: 'localhost' }), new Error('Empty port in CCDB config'));
    });

    it('should successfully initialize CcdbService', () => {
      assert.doesNotThrow(() => new CcdbService({ hostname: 'localhost', port: 8080 }));
    });
  });

  describe('`isConnectionUp()` tests', () => {
    let ccdb;
    before(() => {
      ccdb = new CcdbService(config.ccdb);
    });

    it('should successfully test connection to CCDB', async () => {
      nock('http://ccdb:8500')
        .get('/browse/test')
        .reply(200, { objects: [], subfolders: [] });

      await assert.doesNotReject(ccdb.isConnectionUp());
    });

    it('should return rejected promise when attempting to test connection on CCDB', async () => {
      nock('http://ccdb:8500')
        .get('/browse/test')
        .replyWithError('getaddrinfo ENOTFOUND ccdb ccdb:8500');
      await assert.rejects(async () => await ccdb.isConnectionUp(), new Error('Unable to connect to CCDB due to: Error: getaddrinfo ENOTFOUND ccdb ccdb:8500'));
    });
  });

  describe('`getObjectsLatestVersionList()` tests', () => {
    it('should reject with error for fields parameter not being a list', async () => {
      const ccdb = new CcdbService(config.ccdb);
      await assert.rejects(
        async () => await ccdb.getObjectsLatestVersionList('/qc', 'bad-fields'),
        new Error('Unable to retrieve list of latest versions of objects due to: fields.join is not a function'),
      );
    });

    it('should successfully return a list of the objects with requested default headers', async () => {
      const ccdb = new CcdbService(config.ccdb);
      const objects = [
        { path: 'object/one', Created: '101', 'Last-Modified': '102' },
        { path: 'object/two', Created: '101', 'Last-Modified': '102' },
        { path: 'object/three', Created: '101', 'Last-Modified': '102' },
      ];
      nock('http://ccdb:8500', {
        reqheaders: {
          Accept: 'application/json',
          'X-Filter-Fields': 'path,Created,Last-Modified',
        },
      })
        .get('/latest/test.*')
        .reply(200, { objects: objects, subfolders: [] });
      const objectsRetrieved = await ccdb.getObjectsLatestVersionList();
      assert.deepStrictEqual(objectsRetrieved, objects, 'Received objects are not alike');
    });

    it('should successfully return a list of the objects with specified headers', async () => {
      const ccdb = new CcdbService(config.ccdb);
      const objects = [
        { path: 'object/one', Created: '101', 'Last-Modified': '102', Id: 1 },
        { path: 'object/two', Created: '101', 'Last-Modified': '102', Id: 2 },
        { path: 'object/three', Created: '101', 'Last-Modified': '102', Id: 3 },
      ];
      nock('http://ccdb:8500', {
        reqheaders: {
          Accept: 'application/json',
          'X-Filter-Fields': 'Id',
        },
      })
        .get('/latest/.*')
        .reply(200, { objects: objects, subfolders: [] });
      const objectsRetrieved = await ccdb.getObjectsLatestVersionList('', ['Id']);
      assert.deepStrictEqual(objectsRetrieved, objects, 'Received objects are not alike');
    });

    it('should reject due to HTTP request error', async () => {
      const ccdb = new CcdbService(config.ccdb);
      const error = new Error('Querying service is down');
      nock('http://ccdb:8500')
        .get('/latest/test.*')
        .replyWithError(error);
      assert.rejects(async () => await ccdb.getObjectsLatestVersionList(), new Error(`Unable to retrieve list of latest versions of objects due to: ${error.message || error}`));
    });
  });

  describe('`getObjectTimestampList()` tests', () => {
    it('should successfully return a list of Valid-From timestamps for a specific object', async () => {
      const ccdb = new CcdbService(config.ccdb);
      const objects = [
        { path: 'object/one', Created: '101', 'Valid-From': '102', id: 'id', metadata: [] },
        { path: 'object/one', Created: '101', 'Valid-From': '103', id: 'id', metadata: [] },
        { path: 'object/one', Created: '101', 'Valid-From': '104', id: 'id', metadata: [] },
      ];
      const expectedTimestamps = [102, 103, 104];
      nock('http://ccdb:8500')
        .get('/browse/object/one/')
        .reply(200, { objects, subfolders: [] });

      const result = await ccdb.getObjectTimestampList('object/one');
      assert.deepStrictEqual(result, expectedTimestamps);
    });

    it('should successfully return an empty list due to empty reply from CCDB', async () => {
      const ccdb = new CcdbService(config.ccdb);
      nock('http://ccdb:8500')
        .get('/browse/object/one/')
        .reply(200, { objects: [], subfolders: [] });

      const result = await ccdb.getObjectTimestampList('object/one');
      assert.deepStrictEqual(result, []);
    });
  });

  describe('`getObjectLatestVersionInfo()` tests', () => {
    it('should throw error if path for object to be queried is not provided', async () => {
      const ccdb = new CcdbService(config.ccdb);
      await assert.rejects(
        async () => await ccdb.getObjectLatestVersionInfo(),
        new Error('Failed to load object due to missing path'),
      );
      await assert.rejects(
        async () => await ccdb.getObjectLatestVersionInfo(null),
        new Error('Failed to load object due to missing path'),
      );
      await assert.rejects(
        async () => await ccdb.getObjectLatestVersionInfo(undefined),
        new Error('Failed to load object due to missing path'),
      );
    });

    it('should throw error if data service rejected the request', async () => {
      const ccdb = new CcdbService(config.ccdb);
      nock('http://ccdb:8500')
        .get('/latest/object/one/')
        .reply(502, 'Unable to find object');

      await assert.rejects(
        async () => await ccdb.getObjectLatestVersionInfo('object/one'),
        new Error('Unable to retrieve object for: object/one'),
      );
    });

    it('should throw error if received object is not valid', async () => {
      const ccdb = new CcdbService(config.ccdb);
      const objects = [{ Created: '101', 'Last-Modified': '102', id: 'id', metadata: [] }];
      nock('http://ccdb:8500')
        .get('/latest/object/one/')
        .reply(200, { objects, subfolders: [] });

      await assert.rejects(
        async () => await ccdb.getObjectLatestVersionInfo('object/one'),
        new Error('Unable to retrieve object for: object/one'),
      );
    });

    it('should successfully return a valid object', async () => {
      const ccdb = new CcdbService(config.ccdb);
      const objects = [{ path: 'object/one', Created: '101', 'Last-Modified': '102', id: 'id', metadata: [] }];
      nock('http://ccdb:8500')
        .get('/latest/object/one/')
        .reply(200, { objects, subfolders: [] });

      const result = await ccdb.getObjectLatestVersionInfo('object/one');
      assert.deepStrictEqual(result, objects[0]);
    });
  });

  describe('`getObjectDetails()` tests', () => {
    let ccdb;
    before(() => {
      ccdb = new CcdbService(config.ccdb);
    });

    it('should throw error due to missing parameters (name or timestamp)', async () => {
      await assert.rejects(async () => ccdb.getObjectDetails(), new Error('Missing mandatory parameters: name & timestamp'));
      await assert.rejects(async () => ccdb.getObjectDetails(null), new Error('Missing mandatory parameters: name & timestamp'));
      await assert.rejects(async () => ccdb.getObjectDetails(undefined), new Error('Missing mandatory parameters: name & timestamp'));
      await assert.rejects(async () => ccdb.getObjectDetails('', '2'), new Error('Missing mandatory parameters: name & timestamp'));
      await assert.rejects(async () => ccdb.getObjectDetails('name'), new Error('Missing mandatory parameters: name & timestamp'));
      await assert.rejects(async () => ccdb.getObjectDetails('name', null), new Error('Missing mandatory parameters: name & timestamp'));
      await assert.rejects(async () => ccdb.getObjectDetails('name', undefined), new Error('Missing mandatory parameters: name & timestamp'));
      await assert.rejects(async () => ccdb.getObjectDetails('name', ''), new Error('Missing mandatory parameters: name & timestamp'));
    });

    it('should successfully return content-location field on status >=200 <= 299', async () => {
      nock('http://ccdb:8500')
        .defaultReplyHeaders({ 'content-location': '/download/123123-123123', location: '/download/some-id' })
        .head('/qc/some/test/123455432/')
        .reply(200);
      const content = await ccdb.getObjectDetails('qc/some/test', 123455432);
      assert.strictEqual(content.location, '/download/123123-123123');
    });

    it('should successfully return content-location field if is string as array with "alien" second item on status >=200 <= 299', async () => {
      nock('http://ccdb:8500')
        .defaultReplyHeaders({ 'content-location': '/download/123123-123123, alien://', location: '/download/some-id' })
        .head('/qc/some/test/123455432/')
        .reply(200);
      const content = await ccdb.getObjectDetails('qc/some/test', 123455432);
      assert.strictEqual(content.location, '/download/123123-123123');
    });

    it('should successfully return content-location field if is string as array with "alien" first item on status >=200 <= 299', async () => {
      nock('http://ccdb:8500')
        .defaultReplyHeaders({ 'content-location': 'alien://, /download/123123-123123', location: '/download/some-id' })
        .head('/qc/some/test/123455432/')
        .reply(200);
      const content = await ccdb.getObjectDetails('qc/some/test', 123455432);
      assert.strictEqual(content.location, '/download/123123-123123');
    });

    it('should successfully return drawing options if present', async () => {
      nock('http://ccdb:8500')
        .defaultReplyHeaders({ 'content-location': '/download/some-id', drawoptions: 'colz hep' })
        .head('/qc/some/test/123455432/')
        .reply(200);
      const content = await ccdb.getObjectDetails('qc/some/test', 123455432);
      assert.deepStrictEqual(content.drawOptions, ['colz', 'hep']);
    });

    it('should successfully return displayHints if present', async () => {
      nock('http://ccdb:8500')
        .defaultReplyHeaders({ 'content-location': '/download/some-id', displayhints: 'AP beta' })
        .head('/qc/some/test/123455432/')
        .reply(200);
      const content = await ccdb.getObjectDetails('qc/some/test', 123455432);
      assert.deepStrictEqual(content.displayHints, ['AP', 'beta']);
    });

    it('should reject with error due to invalid status', async () => {
      nock('http://ccdb:8500')
        .head('/qc/some/test/123455432/')
        .reply(404);
      await assert.rejects(async () => ccdb.getObjectDetails('qc/some/test', '123455432'), new Error('Unable to retrieve object: qc/some/test'));
    });

    it('should reject with error due no content-location without alien', async () => {
      nock('http://ccdb:8500')
        .defaultReplyHeaders({ 'content-location': 'alien/some-id' })
        .head('/qc/some/test/123455432/')
        .reply(200);
      await assert.rejects(async () => ccdb.getObjectDetails('qc/some/test', '123455432'), new Error('No location provided by CCDB for object with path: /qc/some/test/123455432/'));
    });

    it('should reject with empty content-location', async () => {
      nock('http://ccdb:8500')
        .defaultReplyHeaders({ 'content-location': '' })
        .head('/qc/some/test/123455432/')
        .reply(200);
      await assert.rejects(async () => ccdb.getObjectDetails('qc/some/test', '123455432'), new Error('No location provided by CCDB for object with path: /qc/some/test/123455432/'));
    });

    it('should reject with missing content-location', async () => {
      nock('http://ccdb:8500')
        .defaultReplyHeaders({ 'content-location': '' })
        .head('/qc/some/test/123455432/')
        .reply(200);
      await assert.rejects(async () => ccdb.getObjectDetails('qc/some/test', '123455432'), new Error('No location provided by CCDB for object with path: /qc/some/test/123455432/'));
    });
  });

  describe('`_getPrefix()` tests', () => {
    let ccdb;
    before(() => {
      ccdb = new CcdbService(config.ccdb);
    });

    it('successfully return empty string when no prefix is provided in config object', () => {
      assert.strictEqual(ccdb._getPrefix({}), '');
      assert.strictEqual(ccdb._getPrefix(undefined), '');
      assert.strictEqual(ccdb._getPrefix({ prefix: '' }), '');
    });
    it('successfully return prefix with no backslash and no forward slash', () => {
      assert.strictEqual(ccdb._getPrefix({ prefix: '/qc' }), 'qc');
      assert.strictEqual(ccdb._getPrefix({ prefix: 'qc/' }), 'qc');
      assert.strictEqual(ccdb._getPrefix({ prefix: '/qc/tst/' }), 'qc/tst');
    });
  });
};
