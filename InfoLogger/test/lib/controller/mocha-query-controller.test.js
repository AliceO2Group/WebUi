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

const assert = require('assert');
const { QueryController } = require('../../../lib/controller/QueryController');
const { spy, stub } = require('sinon');
const { TimeoutError } = require('@aliceo2/web-ui');
const { AbortError } = require('../../../lib/utils/queryCancellation');

describe('QueryController test suite', () => {
  describe('getQueryStats() - test suite', () => {
    let res = {};
    const ctrl = new QueryController();

    beforeEach(() => {
      res = {
        status: stub().returnsThis(),
        json: spy(),
      };
    });

    it('should return error due to undefined being passes as runNumber', () => {
      const ctrl = new QueryController();
      ctrl.getQueryStats({ query: { runNumber: undefined } }, res);

      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({ error: 'Invalid runNumber provided' }));
    });
    it('should return error due to null being passes as runNumber', () => {
      ctrl.getQueryStats({ query: { runNumber: null } }, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({ error: 'Invalid runNumber provided' }));
    });
    it('should return error due to NaN being passes as runNumber', () => {
      ctrl.getQueryStats({ query: { runNumber: '22f2' } }, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({ error: 'Invalid runNumber provided' }));
    });

    it('should return specific status code due to query service throwing TimeoutError', async () => {
      const ctrl = new QueryController({
        queryGroupCountLogsBySeverity: stub().rejects(new TimeoutError('Unable to connect to host')),
      });
      await ctrl.getQueryStats({ query: { runNumber: 555123 } }, res);
      assert.ok(res.status.calledWith(408));
      assert.ok(res.json.calledWith({
        title: 'Timeout',
        message: 'Unable to connect to host',
        status: 408,
      }));
    });

    it('should successfully return stats for known severities', async () => {
      const stats = {
        D: 1223,
        I: 432131,
        W: 50,
        E: 2,
        F: 1,
      };
      const ctrl = new QueryController({
        queryGroupCountLogsBySeverity: stub().resolves(stats),
      });
      await ctrl.getQueryStats({ query: { runNumber: 555123 } }, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(stats));
    });
  });

  describe('getLogs', () => {
    let queryService = {};
    let queryController = {};
    let res = {};

    beforeEach(() => {
      queryService = {
        queryFromFilters: stub(),
      };
      queryController = new QueryController(queryService);

      res = {
        status: stub().returnsThis(),
        json: stub(),
      };
    });
    it('should return 400 if criterias are missing or empty', async () => {
      await queryController.getLogs({ body: { criterias: null } }, res);

      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({ error: 'Invalid query parameters provided' }));
    });

    it('should successfully return logs if queryFromFilters is successful', async () => {
      const logs = [{ id: 1, message: 'log1' }];
      const body = {
        criterias: { key: 'value' },
        options: { },
      };
      const callbacks = {};
      res.on = (event, fn) => {
        callbacks[event] = fn;
        return res;
      };
      queryService.queryFromFilters.resolves(logs);

      await queryController.getLogs({ body }, res);

      assert.ok(queryService.queryFromFilters.called);
      const call = queryService.queryFromFilters.getCall(0);
      assert.strictEqual(call.args[0], body.criterias);
      assert.strictEqual(call.args[1], body.options);
      assert.ok(!call.args[2].aborted); // signal should not have been aborted on success
      assert.ok(call.args[2] instanceof AbortSignal);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(logs));
    });

    it('should return specific timeout error when query times out', async () => {
      const body = {
        criterias: { key: 'value' },
        options: {},
      };
      const callbacks = {};
      res.on = (event, fn) => {
        callbacks[event] = fn;
        return res;
      };
      queryService.queryFromFilters.rejects(new TimeoutError('QUERY TIMED OUT'));

      await queryController.getLogs({ body }, res);

      assert.ok(res.status.calledWith(408));
      assert.ok(res.json.calledWith({ title: 'Timeout', message: 'QUERY TIMED OUT', status: 408 }));
    });

    it('should not send response when client closes connection before query completes', async () => {
      const body = {
        criterias: { key: 'value' },
        options: {},
      };
      const callbacks = {};
      res.on = (event, fn) => {
        callbacks[event] = fn;
        return res;
      };

      // Query that completes after close event
      queryService.queryFromFilters.callsFake(() => new Promise((resolve) => {
        setTimeout(() => {
          resolve([{ id: 1, message: 'log1' }]);
        }, 50);
      }));

      const queryPromise = queryController.getLogs({ body }, res);
      // Simulate client closing connection before query completes
      await new Promise((r) => setTimeout(r, 10));
      callbacks.close();
      await queryPromise;

      // Response should not be sent
      assert.ok(res.status.notCalled);
      assert.ok(res.json.notCalled);
    });

    it('should successfully return logs even if close event fires after finish event', async () => {
      const logs = [{ id: 1, message: 'log1' }];
      const body = {
        criterias: { key: 'value' },
        options: {},
      };
      const callbacks = {};
      res.on = (event, fn) => {
        callbacks[event] = fn;
        return res;
      };

      queryService.queryFromFilters.resolves(logs);

      const queryPromise = queryController.getLogs({ body }, res);
      await queryPromise;

      // Simulate normal flow: finish fires, then close
      callbacks.finish();
      callbacks.close();

      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(logs));
    });

    it('should handle QUERY_CANCELLED error and not send response', async () => {
      const body = {
        criterias: { key: 'value' },
        options: {},
      };
      const callbacks = {};
      res.on = (event, fn) => {
        callbacks[event] = fn;
        return res;
      };
      queryService.queryFromFilters.rejects(new AbortError());

      await queryController.getLogs({ body }, res);

      // Should not send any response on cancellation
      assert.ok(res.status.notCalled);
      assert.ok(res.json.notCalled);
    });
  });
});
