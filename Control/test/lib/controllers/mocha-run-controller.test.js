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

describe(`'RunController' test suite`, () => {
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub()
  }

  describe(`'getCalibrationRunsHandler' test suite`, async () => {
    it('should successfully return calibrations runs grouped by detector', async () => {
      const runs = {
        TPC: [
          {runNumber: 1},
          {runNumber: 2},
        ]
      };
      const runController = new RunController({
        retrieveCalibrationRunsGroupedByDetector: sinon.stub().resolves(runs)
      });
      await runController.getCalibrationRunsHandler({}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(runs));
    });

    it('should return 500 response as there was a problem internally', async () => {
      const runController = new RunController({
        retrieveCalibrationRunsGroupedByDetector: sinon.stub().rejects(new Error('Something went wrong'))
      });
      await runController.getCalibrationRunsHandler({}, res);
      assert.ok(res.status.calledWith(500));
      assert.ok(res.json.calledWith({message: 'Something went wrong'}));
    });
  });

});
