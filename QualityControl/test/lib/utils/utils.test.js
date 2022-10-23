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

import { stub } from 'sinon';
import nock from 'nock';
import { ok, strictEqual, deepStrictEqual, rejects } from 'assert';
import { errorHandler, httpHeadJson } from './../../../lib/utils/utils.js';

export default async () => {
  before(() => nock.cleanAll());

  describe('Check errors are handled and sent successfully', () => {
    let res;

    beforeEach(() => {
      res = {
        status: stub().returnsThis(),
        send: stub(),
      };
    });

    it('should successfully respond with built error message when there is a message and no status', () => {
      errorHandler('Error', 'Error', res);
      ok(res.status.calledOnce);
    });

    it('should successfully respond with built error message and status > 500', () => {
      errorHandler('Error', 'Error', res, 502);
      ok(res.status.calledWith(502));
    });

    it('should successfully respond with built error message and status < 500', () => {
      errorHandler('Error', 'Error', res, 404);
      ok(res.status.calledWith(404));
    });

    it('should successfully respond with built error.message and status', () => {
      const err = {
        message: 'Test Error',
        stack: 'Some Stack',
      };
      errorHandler(err, 'Error To Send', res, 502);
      ok(res.status.calledWith(502));
      ok(res.send.calledWith({ message: 'Error To Send' }));
    });

    it('should successfully respond with built error.message, no stack and status', () => {
      const err = 'Test Error';
      errorHandler(err, 'Error To Send', res, 404);
      ok(res.status.calledWith(404));
      ok(res.send.calledWith({ message: 'Error To Send' }));
    });
  });

  describe('"httpHeadJson" test suite ', () => {
    it('should successfully return status and headers with host, port and path provided', async () => {
      nock('http://ccdb:8500')
        .defaultReplyHeaders({ lastModified: 123132132, location: '/download/some-id' })
        .head('/qc/some/test/123455432')
        .reply(200);

      const { status, headers } = await httpHeadJson('ccdb', '8500', '/qc/some/test/123455432');
      strictEqual(status, 200);
      deepStrictEqual(headers, { lastmodified: '123132132', location: '/download/some-id' });
    });

    it('should successfully return status and headers with host, port, path and headers provided', async () => {
      nock('http://ccdb:8500', {
        reqHeaders: { Accept: 'text' },
      })
        .defaultReplyHeaders({ lastModified: 123132132, location: '/download/some-id' })
        .head('/qc/some/test/123455432')
        .reply(200);

      const { status, headers } = await httpHeadJson('ccdb', '8500', '/qc/some/test/123455432', { Accept: 'text' });
      strictEqual(status, 200);
      deepStrictEqual(headers, { lastmodified: '123132132', location: '/download/some-id' });
    });
    it('should reject if call was not successful', async () => {
      nock('http://ccdb:8500')
        .defaultReplyHeaders({ lastModified: 123132132, location: '/download/some-id' })
        .head('/qc/some/test/123455432')
        .replyWithError('Something went wrong');

      await rejects(async () => {
        await httpHeadJson('ccdb', '8500', '/qc/some/test/123455432');
      }, new Error('Something went wrong'));
    });
  });
};
