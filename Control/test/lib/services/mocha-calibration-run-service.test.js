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

const {RUNTIME_COMPONENT: {COG}, RUNTIME_KEY: {CALIBRATION_MAPPING}} = require('./../../../lib/common/kvStore/runtime.enum.js');
const {CalibrationRunService} = require('./../../../lib/services/CalibrationRun.service.js');
const {BookkeepingService} = require('../../../lib/services/Bookkeeping.service.js');
const {NotFoundError} = require('../../../lib/errors/NotFoundError.js');

describe('CalibrationRunService test suite', () => {
  const url = 'http://bkp-test.cern.ch:8888';
  const bkpService = new BookkeepingService({url, token: ''});
  bkpService.getRunTypes = sinon.stub().resolves({});



  describe(`'init' test suite`, async () => {
    it('should retrieve a map of of runTypes and calibration mappings and save them in-memory', async () => {
      const getRuntimeEntryByComponent = sinon.stub();
      getRuntimeEntryByComponent.withArgs(COG, CALIBRATION_MAPPING).resolves({TPC: ['NOISE', 'PULSE'], ABC: ['SOME-OTHER']});
      const apricotServiceStub = {getRuntimeEntryByComponent};
      const calibrationService = new CalibrationRunService(bkpService, apricotServiceStub);

      await calibrationService.init();

      assert.deepStrictEqual(calibrationService.runTypes, {});
      assert.deepStrictEqual(calibrationService.calibrationPerDetectorMap, {TPC: ['NOISE', 'PULSE'], ABC: ['SOME-OTHER']});
    });

    it('should keep an empty object for mappings due to failure to retrieve data from apricot', async () => {
      const getRuntimeEntryByComponent = sinon.stub();
      getRuntimeEntryByComponent.withArgs(COG, CALIBRATION_MAPPING).rejects(new NotFoundError('key not found'));
      const apricotServiceStub = {getRuntimeEntryByComponent};
      const calibrationService = new CalibrationRunService(bkpService, apricotServiceStub);
      await calibrationService.init();

      assert.deepStrictEqual(calibrationService.calibrationPerDetectorMap, {});
    });
  });
});
