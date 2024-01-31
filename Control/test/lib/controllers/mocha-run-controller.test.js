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

const assert = require('assert');
const sinon = require('sinon');

const {RunController} = require('../../../lib/controllers/Run.controller.js');
const {TimeoutError} = require('../../../lib/errors/TimeoutError.js');

describe(`'RunController' test suite`, () => {
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub()
  }

  describe(`'getCalibrationRunsHandler' test suite`, () => {
    it('should successfully return calibrations runs grouped by detector by requesting information as cache is not enabled', async () => {
      const runs = {
        TPC: [
          {runNumber: 1},
          {runNumber: 2},
        ]
      };
      const runController = new RunController(
        {
          retrieveCalibrationRunsGroupedByDetector: sinon.stub().resolves(runs)
        }
      );
      await runController.getCalibrationRunsHandler({}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(runs));
    });

    it('should successfully return calibrations runs grouped by detector by from cache', async () => {
      const runs = {
        TPC: [
          {runNumber: 1},
          {runNumber: 2},
        ]
      };
      const runController = new RunController(
        {
          getByKey: runs
        }
      );
      await runController.getCalibrationRunsHandler({}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(runs));
    });

    it('should successfully return an empty object if no runs were loaded', async () => {
      const runController = new RunController(
        {
          retrieveCalibrationRunsGroupedByDetector: sinon.stub().resolves({})
        }
      );
      await runController.getCalibrationRunsHandler({}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({}));
    });

    it('should return error if both cache and retrieve live options failed', async () => {
      const runController = new RunController(
        {
          retrieveCalibrationRunsGroupedByDetector: sinon.stub().rejects(new Error('Unable to retrieve such runs'))
        }
      );
      await runController.getCalibrationRunsHandler({}, res);
      assert.ok(res.status.calledWith(500));
      assert.ok(res.json.calledWith({message: 'Unable to retrieve such runs'}));
    });
  });

  describe(`'refreshCalibrationRunsConfigurationHandler' test suite`, async () => {
    it('should successfully request a re-load of the configurations for calibration page', async () => {
      const runController = new RunController(
        {
          load: sinon.stub().resolves()
        }
      );
      await runController.refreshCalibrationRunsConfigurationHandler({}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({ok: true}));
    });
    it('should respond with error if the re-load process failed', async () => {
      const runController = new RunController(
        {
          load: sinon.stub().throws(new TimeoutError('Request Expired'))
        }
      );
      await runController.refreshCalibrationRunsConfigurationHandler({}, res);
      assert.ok(res.status.calledWith(408));
      assert.ok(res.json.calledWith({message: 'Request Expired'}));
    });
  });
});
