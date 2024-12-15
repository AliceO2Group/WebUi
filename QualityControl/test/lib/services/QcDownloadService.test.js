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

/* eslint-disable require-jsdoc */
/* eslint-disable max-len */

import { deepStrictEqual, strictEqual, rejects } from 'node:assert';
import { suite, test, before } from 'node:test';
import nock from 'nock';

import { CcdbService } from '../../../lib/services/ccdb/CcdbService.js';
import { CCDB_MONITOR, CCDB_VERSION_KEY } from '../../../lib/services/ccdb/CcdbConstants.js';
import { QcDownloadService } from '../../../../Framework/Backend/index.js';

const ccdbConfig = {
  hostname: 'ccdb-local',
  port: 8083,
  protocol: 'https',
};

const qcDlServiceConfig = {
  tarFileName: 'download',
  cleanUpEvent: 'exit',
  dirLifespan: 250,
};

export const qcDownloadServiceTestSuite = async () => {
  await suite('QC Download Test Suite - ', () => {
    before(() => nock.cleanAll());

    suite('Creating a new QcDownloadService instance', () => {
      test('should successfully initialize QcDownloadService', () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig, ccdbConfig);

        strictEqual(qcDlService.ccdb_server_url, 'https://ccdb-local:8083');
        strictEqual(qcDlService.tarFileName, 'download');
        strictEqual(qcDlService.cleanUpEvent, 'exit');
      });
    });

    suite('Initializing a new QcDownloadService download', () => {
      test('Should successfully initialize temporary root directory for QcDownloadService', () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig, ccdbConfig);

        qcDlService.initTmpDir((err) => {
          strictEqual(err, null);
        });
      });
      test('Should successfully delete root directory for QcDownloadService requests', () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig, ccdbConfig);

        qcDlService.initTmpDir((err) => {
          strictEqual(err, null);
        });
      });
      test('Should successfully initialize child directory for QcDownloadService requests', () => {

      });
    });
  });
};
