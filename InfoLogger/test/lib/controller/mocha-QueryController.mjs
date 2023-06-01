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
/* eslint-disable max-len */

import assert from 'assert';
import {QueryController} from '../../../lib/controller/QueryController.mjs';
import {spy, stub} from 'sinon';

describe('QueryController test suite', () => {
  describe('getQueryStats() - test suite', () => {
    let res;
    const ctrl = new QueryController();

    beforeEach(() => {
      res = {
        status: stub().returnsThis(),
        json: spy()
      };
    });

    it('should return error due to undefined being passes as runNumber', () => {
      const ctrl = new QueryController();
      ctrl.getQueryStats({query: {runNumber: undefined}}, res);

      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({error: 'Invalid runNumber provided'}));
    });
    it('should return error due to null being passes as runNumber', () => {
      ctrl.getQueryStats({query: {runNumber: null}}, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({error: 'Invalid runNumber provided'}));

    });
    it('should return error due to NaN being passes as runNumber', () => {
      ctrl.getQueryStats({query: {runNumber: '22f2'}}, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({error: 'Invalid runNumber provided'}));
    });

    it('should return error due to query service throwing error', async () => {
      const ctrl = new QueryController({
        queryGroupCountLogsBySeverity: stub().rejects(new Error('Unable to connect to host'))
      });
      await ctrl.getQueryStats({query: {runNumber: 555123}}, res);
      assert.ok(res.status.calledWith(502));
      assert.ok(res.json.calledWith({error: 'Unable to serve query on stats for runNumber: 555123'}));
    });

    it('should successfully return stats for known severities', async () => {
      const stats = {
        D: 1223,
        I: 432131,
        W: 50,
        E: 2,
        F: 1,
      }
      const ctrl = new QueryController({
        queryGroupCountLogsBySeverity: stub().resolves(stats)
      });
      await ctrl.getQueryStats({query: {runNumber: 555123}}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(stats));

    });
  });
});
