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
const {DetectorService} = require('../../../lib/services/Detector.service.js');
const { TimeoutError } = require('@aliceo2/web-ui');

describe(`'DetectorService' test suite`, () => {
    
  describe(`'areDetectorsAvailable' test suite`, async () => {
    it('should successfully respond with positive boolean for empty list to check', async () => {
      const detectorService = new DetectorService({
        GetActiveDetectors: sinon.stub().resolves({detectors: ['ABC']})
      }, {});

      const areDetectorsAvailable = await detectorService.areDetectorsAvailable([]);
      assert.ok(areDetectorsAvailable);
    });

    it('should successfully respond with positive boolean for given detectors list', async () => {
      const detectorService = new DetectorService({
        GetActiveDetectors: sinon.stub().resolves({detectors: ['ABC']})
      }, {});

      const areDetectorsAvailable = await detectorService.areDetectorsAvailable(['TPC']);
      assert.ok(areDetectorsAvailable);
    });

    it('should successfully respond with negative boolean for given detectors list', async () => {
      const detectorService = new DetectorService({
        GetActiveDetectors: sinon.stub().resolves({detectors: ['ABC']})
      }, {});

      const areDetectorsAvailable = await detectorService.areDetectorsAvailable(['ABC']);
      assert.ok(!areDetectorsAvailable);
    });

    it('should reject with JS native error from grpc core proxy service', async () => {
      const detectorService = new DetectorService({
        GetActiveDetectors: sinon.stub().rejects({code: 4, details: 'Timeout'})
      }, {});
      await assert.rejects(
        () => detectorService.areDetectorsAvailable(['TPC']),
        (err) => err instanceof TimeoutError && err.message === 'Timeout'
      );
    });
  });

  describe(`'getDetectorList' test suite`, async () => {
    it('should successfully retrieve list of detectors from apricot', async () => {
      const detectorService = new DetectorService({}, {
        ListDetectors: sinon.stub().resolves({detectors: ['TPC', 'TRD']})
      });

      const detectors = await detectorService.getDetectorList();
      assert.deepStrictEqual(detectors, ['TPC', 'TRD']);
      assert.deepStrictEqual(detectorService.detectors, ['TPC', 'TRD']);
    });

    it('should remove empty and whitespace-only detectors from returned list', async () => {
      const detectorService = new DetectorService({}, {
        ListDetectors: sinon.stub().resolves({detectors: ['TPC', '', '   ', '\t', 'TRD']})
      });

      const detectors = await detectorService.getDetectorList();
      assert.deepStrictEqual(detectors, ['TPC', 'TRD']);
      assert.deepStrictEqual(detectorService.detectors, ['TPC', 'TRD']);
    });

    it('should initialize with empty in-memory detectors list', async () => {
      const detectorService = new DetectorService({}, {});
      assert.deepStrictEqual(detectorService.detectors, []);
    });

    it('should return in-memory detectors list without requesting apricot again', async () => {
      const apricotListDetectorsStub = sinon.stub().resolves({detectors: ['SHOULD_NOT_BE_USED']});
      const detectorService = new DetectorService({}, {
        ListDetectors: apricotListDetectorsStub
      });
      detectorService.detectors = ['TPC', 'TRD'];

      const detectors = await detectorService.getDetectorList();
      assert.deepStrictEqual(detectors, ['TPC', 'TRD']);
      assert.ok(apricotListDetectorsStub.notCalled);
    });

    it('should reject with JS native error from grpc apricot proxy service', async () => {
      const detectorService = new DetectorService({}, {
        ListDetectors: sinon.stub().rejects({code: 4, details: 'Timeout'})
      });
      await assert.rejects(
        () => detectorService.getDetectorList(),
        (error) => error instanceof TimeoutError && error.message === 'Timeout'
      );
    });
  });
});
