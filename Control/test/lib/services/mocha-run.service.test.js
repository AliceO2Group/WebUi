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

const {RUN_DEFINITIONS} = require('./../../../lib/common/runDefinition.enum.js');
const {RunService} = require('./../../../lib/services/Run.service.js');
const {NotFoundError} = require('./../../../lib/errors/NotFoundError.js');

describe(`'RunService' test suite`, async () => {
  describe(`'_retrieveCalibrationConfigurationsForDetectors test suite`, async () => {
    it('should return empty object if apricot service throws error', async () => {
      const getRuntimeEntryByComponent = sinon.stub().rejects(new NotFoundError('key not found'));
      const runSrv = new RunService({}, {getRuntimeEntryByComponent});

      const result = await runSrv._retrieveCalibrationConfigurationsForDetectors();
      assert.deepStrictEqual(result, {});
    });

    it('should return empty object if JSON.parse of response throws error', async () => {
      const getRuntimeEntryByComponent = sinon.stub().resolves('{"prop": "Invalid Object}');
      const runSrv = new RunService({}, {getRuntimeEntryByComponent});

      const result = await runSrv._retrieveCalibrationConfigurationsForDetectors();
      assert.deepStrictEqual(result, {});
    });

    it('should successfully return results', async () => {
      const calibrationConfigurations = {
        TPC: [
          {runType: 'NOISE', configuration: 'cpv-noise', label: 'CPV NOISE'},
          {runType: 'PULSE', configuration: 'cpv-pulse', label: 'CPV PULSE'},
        ],
        ABC: [
          {runType: 'SOMEOTHER', configuration: 'abc-someother', label: 'ABC SOME OTHER'},
        ]
      };
      const getRuntimeEntryByComponent = sinon.stub().resolves(JSON.stringify(calibrationConfigurations));
      const runSrv = new RunService({}, {getRuntimeEntryByComponent});

      const result = await runSrv._retrieveCalibrationConfigurationsForDetectors();

      assert.deepStrictEqual(result, calibrationConfigurations);
    });
  });

  describe(`'retrieveCalibrationRunsGroupedByDetector test suite`, async () => {
    it('should return an empty object due to missing calibrationsPerDetectorMap being empty', async () => {
      const runSrv = new RunService();
      const result = await runSrv.retrieveCalibrationRunsGroupedByDetector();
      assert.deepStrictEqual(result, {});
    });

    it('should return an object with calibration runs grouped by detector', async () => {
      const getRun = sinon.stub();
      getRun.withArgs(RUN_DEFINITIONS.CALIBRATION, 0, 'TPC').resolves({runNumber: 1});
      getRun.withArgs(RUN_DEFINITIONS.CALIBRATION, 1, 'TPC').resolves({runNumber: 2});
      getRun.withArgs(RUN_DEFINITIONS.CALIBRATION, 2, 'ABC').resolves({runNumber: 3});
      getRun.withArgs(RUN_DEFINITIONS.CALIBRATION, 1, 'ABC').resolves({runNumber: 4});
      getRun.withArgs(RUN_DEFINITIONS.CALIBRATION, 1, 'XYZ').resolves(undefined);

      const runSrv = new RunService({getRun}, {});
      runSrv._runTypes = {
        NOISE: 0,
        PULSE: 1,
        SOMEOTHER: 2,
      };
      runSrv._calibrationConfigurationPerDetectorMap = {
        TPC: [
          {runType: 'NOISE', configuration: 'cpv-noise', label: 'CPV NOISE'},
          {runType: 'PULSE', configuration: 'cpv-pulse', label: 'CPV PULSE'},
        ],
        ABC:  [
          {runType: 'SOMEOTHER', configuration: 'abc-someother', label: 'ABC SOME OTHER'},
        ],
        XYZ: [
          {runType: 'NONEXISTENT', configuration: 'xyz-someother', label: 'XYZ NON'},
        ], // detector with no run found or nonexistent type
      };
      const result = await runSrv.retrieveCalibrationRunsGroupedByDetector();
      assert.deepStrictEqual(result, {
        TPC: [
          {runNumber: 1},
          {runNumber: 2},
        ],
        ABC: [
          {runNumber: 3},
        ],
        XYZ: []
      });
    });
  });
});
