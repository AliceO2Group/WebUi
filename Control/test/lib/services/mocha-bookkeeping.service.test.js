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
const nock = require('nock');

const {BookkeepingService} = require('../../../lib/services/Bookkeeping.service');

describe('BookkeepingService test suite', () => {
  const url = 'http://bkp-test.cern.ch:8888';
  let bkp = new BookkeepingService({url, token: ''});

  describe(`'getRunTypes' test suite`, async () => {
    before(() => {
      bkp = new BookkeepingService({url, token: ''});
      nock(url)
        .get('/api/runTypes?token=')
        .reply(200, {
          data: [
            {name: 'NOISE', id: 1}, {name: 'PHYSICS', id: 2}, {name: 'SYNTHETIC', id: 3}
          ]
        });
      nock(url)
        .get('/api/runTypes?token=no-data')
        .reply(200, {data: []});
      nock(url)
        .get('/api/runTypes?token=error')
        .replyWithError('Unable to connect');
    });
    after(() => nock.cleanAll());

    it('should successfully return runTypes as object from bookkeeping', async () => {
      const runTypes = await bkp.getRunTypes();
      assert.deepStrictEqual(runTypes, {NOISE: 1, PHYSICS: 2, SYNTHETIC: 3});
    });

    it('should successfully load an empty object if no runTypes are provided', async () => {
      bkp._token = 'no-data';
      const runTypes = await bkp.getRunTypes();
      assert.deepStrictEqual(runTypes, {});
    });

    it('should successfully load an empty object even if bookkeeping returned an error', async () => {
      bkp._token = 'error';
      const runTypes = await bkp.getRunTypes();
      assert.deepStrictEqual(runTypes, {});
    });
  });

  describe(`'getRun' test suite`, async () => {
    let runToReturn = {
      runNumber: 123,
      environmentId: 'abc',
      definition: 'CALIBRATION',
      calibrationStatus: 'good',
      runType: {name: 'NOISE', id: 1},
      detectors: ['TPC'],
      startTime: Date.now() - 100,
      endTime: Date.now(),
      extraField: '',
      someOther: 1234
    };
    before(() => {
      bkp = new BookkeepingService({url, token: ''});
      // runTypes = {NOISE: 1, PHYSICS: 2, SYNTHETIC: 3}; mapping describing usecases below
      nock(url)
        .get('/api/runs?page[limit]=1&filter[detectors][operator]=and&filter[detectors][values]=TPC'
          + '&filter[runTypes]=1&filter[definitions]=CALIBRATION'
          + '&token=')
        .reply(200, {
          data: [runToReturn]
        });
      nock(url)
        .get('/api/runs?page[limit]=1&filter[detectors][operator]=and&filter[detectors][values]=TPC'
          + '&filter[runTypes]=2&filter[definitions]=CALIBRATION'
          + '&token=')
        .reply(200, {
          data: []
        });
      nock(url)
        .get('/api/runs?page[limit]=1&filter[detectors][operator]=and&filter[detectors][values]=TPC'
          + '&filter[runTypes]=3&filter[definitions]=CALIBRATION'
          + '&token=')
        .replyWithError('Unable');
    });
    after(() => nock.cleanAll());

    it('should successfully return a run based on existing runType and provided def, type and detector', async () => {
      const run = await bkp.getRun({
        definitions: 'CALIBRATION',
        runTypes: 1,
        detectors: 'TPC'
      });
      const expectedRun = JSON.parse(JSON.stringify(runToReturn));
      expectedRun.runType = expectedRun.runType.name;
      delete expectedRun.extraField;
      delete expectedRun.someOther;
      assert.deepStrictEqual(run, expectedRun);
    });

    it('should successfully return null run if none was found', async () => {
      const run = await bkp.getRun({
        definitions: 'CALIBRATION',
        runTypes: 2,
        detectors: 'TPC'
      });
      assert.deepStrictEqual(run, null);
    });

    it('should successfully return null run even if bkp service throws error', async () => {
      const run = await bkp.getRun({
        definitions: 'CALIBRATION',
        runTypes: 3,
        detectors: 'TPC'
      });
      assert.deepStrictEqual(run, null);
    });
  });
});
