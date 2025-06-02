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

import nock from 'nock';
import { strictEqual, deepStrictEqual, rejects } from 'node:assert';
import { suite, test, before } from 'node:test';
import { httpGetJson, httpHeadJson } from '../../../lib/utils/httpRequests.js';

export const httpRequestsTestSuite = async () => {
  suite('"httpHeadJson" test suite ', () => {
    before(() => nock.cleanAll());

    test('should successfully return status and headers with host, port and path provided', async () => {
      nock('http://ccdb:8500')
        .defaultReplyHeaders({ lastModified: 123132132, location: '/download/some-id' })
        .head('/qc/some/test/123455432')
        .reply(200);

      const { status, headers } = await httpHeadJson('ccdb', '8500', '/qc/some/test/123455432');
      strictEqual(status, 200);
      deepStrictEqual(headers, { lastmodified: '123132132', location: '/download/some-id' });
    });

    test('should successfully return status and headers with host, port, path and headers provided', async () => {
      nock('http://ccdb:8500', {
        reqHeaders: { Accept: 'text' },
      })
        .defaultReplyHeaders({ lastModified: 123132132, location: '/download/some-id' })
        .head('/qc/some/test/123455432')
        .reply(200);

      const { status, headers } =
                await httpHeadJson('ccdb', '8500', '/qc/some/test/123455432', { headers: { Accept: 'text' } });
      strictEqual(status, 200);
      deepStrictEqual(headers, { lastmodified: '123132132', location: '/download/some-id' });
    });

    test('should reject if call was not successful', async () => {
      nock('http://ccdb:8500')
        .defaultReplyHeaders({ lastModified: 123132132, location: '/download/some-id' })
        .head('/qc/some/test/123455432')
        .replyWithError('Something went wrong');

      await rejects(async () => {
        await httpHeadJson('ccdb', '8500', '/qc/some/test/123455432');
      }, new Error('Something went wrong'));
    });
  });

  suite('"httpGetJson" test suite', () => {
    before(() => nock.cleanAll());

    test('should successfully return parsed JSON response', async () => {
      const responseData = { message: 'Hello', code: 123 };

      nock('http://ccdb:8500')
        .get('/api/test')
        .reply(200, responseData, { 'Content-Type': 'application/json' });

      const result = await httpGetJson('ccdb', 8500, '/api/test');
      deepStrictEqual(result, responseData);
    });

    test('should succeed with custom headers', async () => {
      const responseData = { hello: 'world' };

      nock('http://ccdb:8500', {
        reqHeaders: { Accept: 'application/json', 'X-Custom': 'test' },
      })
        .get('/api/test')
        .reply(200, responseData);

      const result = await httpGetJson('ccdb', 8500, '/api/test', {
        headers: { Accept: 'application/json', 'X-Custom': 'test' },
      });

      deepStrictEqual(result, responseData);
    });

    test('should reject on network error', async () => {
      nock('http://ccdb:8500')
        .get('/api/test')
        .replyWithError('Request failed');

      await rejects(() => httpGetJson('ccdb', 8500, '/api/test'), /Request failed/);
    });

    test('should reject on non-2xx status code', async () => {
      nock('http://ccdb:8500')
        .get('/api/test')
        .reply(404, { error: 'Not found' });

      await rejects(() => httpGetJson('ccdb', 8500, '/api/test'), /Non-2xx status code: 404/);
    });

    test('should reject on invalid JSON response', async () => {
      nock('http://ccdb:8500')
        .get('/api/test')
        .reply(200, 'invalid json');

      await rejects(() => httpGetJson('ccdb', 8500, '/api/test'), /Unable to parse JSON/);
    });
  });
};
