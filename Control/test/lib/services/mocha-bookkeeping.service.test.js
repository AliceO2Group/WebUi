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

  describe(`'init' test suite`, async () => {
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

    it('should successfully load runTypes from bookkeeping', async () => {
      await bkp.init();
      assert.deepStrictEqual(bkp.runTypes, {NOISE: 1, PHYSICS: 2, SYNTHETIC: 3});
    });

    it('should successfully load an empty object if no runTypes are provided', async () => {
      bkp._token = 'no-data';
      await bkp.init();
      assert.deepStrictEqual(bkp.runTypes, {});
    });

    it('should successfully load an empty object even if bookkeeping returned an error', async () => {
      bkp._token = 'error';
      await bkp.init();
      assert.deepStrictEqual(bkp.runTypes, {});
    });
  });

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
      bkp._runTypes = {NOISE: 1, PHYSICS: 2, SYNTHETIC: 3};
      nock(url)
        .get('/api/runs?filter[definitions]=CALIBRATION&filter[runTypes]=1&page[limit]=1&'
          + 'filter[detectors][operator]=and&filter[detectors][values]=TPC&token=')
        .reply(200, {
          data: [runToReturn]
        });

      nock(url)
        .get('/api/runs?filter[definitions]=CALIBRATION&filter[runTypes]=2&page[limit]=1&'
          + 'filter[detectors][operator]=and&filter[detectors][values]=TPC&token=')
        .reply(200, {
          data: []
        });

      nock(url)
        .get('/api/runs?filter[definitions]=CALIBRATION&filter[runTypes]=3&page[limit]=1&'
          + 'filter[detectors][operator]=and&filter[detectors][values]=TPC&token=')
        .replyWithError('Unable');
    });
    after(() => nock.cleanAll());

    it('should successfully return a run based on existing runType and provided def, type and detector', async () => {
      const run = await bkp.getRun('CALIBRATION', 'NOISE', 'TPC');
      const runInfo = JSON.parse(JSON.stringify(runToReturn));
      runInfo.runType = runInfo.runType.name;
      delete runInfo.extraField;
      delete runInfo.someOther;
      assert.deepStrictEqual(run, runInfo);
    });

    it('should successfully return an empty run if none was found', async () => {
      const run = await bkp.getRun('CALIBRATION', 'PHYSICS', 'TPC');
      assert.deepStrictEqual(run, {});
    });

    it('should successfully return an empty run even if bkp service throws error', async () => {
      const run = await bkp.getRun('CALIBRATION', 'SYNTHETIC', 'TPC');
      assert.deepStrictEqual(run, {});
    });
  });
});
