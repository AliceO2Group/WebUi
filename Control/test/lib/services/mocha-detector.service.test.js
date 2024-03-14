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

describe(`'DetectorService' test suite`, () => {
    
  describe(`'areDetectorsAvailable' test suite`, async () => {
    it('should successfully respond with positive boolean for empty list to check', async () => {
      const detectorService = new DetectorService({
        GetActiveDetectors: sinon.stub().resolves({detectors: ['ABC']})
      });

      const areDetectorsAvailable = await detectorService.areDetectorsAvailable([]);
      assert.ok(areDetectorsAvailable);
    });
    it('should successfully respond with positive boolean for given detectors list', async () => {
      const detectorService = new DetectorService({
        GetActiveDetectors: sinon.stub().resolves({detectors: ['ABC']})
      });

      const areDetectorsAvailable = await detectorService.areDetectorsAvailable(['TPC']);
      assert.ok(areDetectorsAvailable);
    });

    it('should successfully respond with negative boolean for given detectors list', async () => {
      const detectorService = new DetectorService({
        GetActiveDetectors: sinon.stub().resolves({detectors: ['ABC']})
      });

      const areDetectorsAvailable = await detectorService.areDetectorsAvailable(['ABC']);
      assert.ok(!areDetectorsAvailable);
    });
    it('should reject with gRPC error from grpc core proxy service', async () => {
      const detectorService = new DetectorService({
        GetActiveDetectors: sinon.stub().rejects({code: 4, details: 'Timeout'})
      });
      assert.rejects(async () => await detectorService.areDetectorsAvailable(['TPC']), {code: 4, details: 'Timeo2ut'});
    });

  });
});
