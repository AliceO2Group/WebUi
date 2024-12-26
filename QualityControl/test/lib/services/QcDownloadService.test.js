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

import fs from 'fs';
const fsp = fs.promises;
import os from 'os';

const ccdbConfig = {
  hostname: 'ccdb-local',
  port: 8083,
  protocol: 'https',
};

const qcDlServiceConfig = {
  tarFileName: 'download',
  cleanUpEvent: 'exit',
  dirLifespan: 500,
};

const TMP_DIR = `${os.homedir()}/.${os.tmpdir().replace('/', '')}/root_obj`;
const REQ_ID = '31hI8934a981438y';
const CCDB_ETAG_TEST_PRIMARY = '8cd8dfca-02fd-11ef-97e1-c0a80209250c';
const CCDB_ETAG_TEST_SECONDARY = '426bb430-55ad-11eb-a04c-2a01cb150434';
const CCDB_ETAG_TEST_ARRAY = [CCDB_ETAG_TEST_PRIMARY, CCDB_ETAG_TEST_SECONDARY];
const CCDB_FILENAME_TEST_PRIMARY = 'TObject_1714047348446.root';
const CCDB_FILENAME_TEST_SECONDARY = 'TObject_1610548820426.root';
const TMP_REQ_DIR = `${TMP_DIR}/${REQ_ID}`;

export const qcDownloadServiceTestSuite = async () => {
  await suite('QC Download Test Suite - ', () => {
    before(() => {
      nock.cleanAll();
      fsp.rm(TMP_DIR);
    });

    suite('Creating a new QcDownloadService instance', () => {
      test('Should successfully initialize QcDownloadService', () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig, ccdbConfig);

        strictEqual(qcDlService._ccdbServerUrl, 'https://ccdb-local:8083');
        strictEqual(qcDlService.tarFileName, 'download');
        strictEqual(qcDlService.cleanUpEvent, 'exit');
      });
    });

    suite('Initializing a new QcDownloadService download', () => {
      test('Should successfully initialize temporary root directory for QcDownloadService', () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig, ccdbConfig);

        qcDlService.initTmpDir((err) => {
          if (err) {
            strictEqual(err, qcDlService._codes.CLEARED_CORPSES);
          } else {
            strictEqual(err, null);
          }
        });
        setTimeout(() => {
          strictEqual(fs.existsSync(TMP_DIR), true); //Directory should have been created
        }, 100);
      });
      // test('Should successfully delete root directory for QcDownloadService requests on exit', () => {
      //   const qcDlService = new QcDownloadService(qcDlServiceConfig, ccdbConfig);
      //
      //   qcDlService.initTmpDir((err) => {
      //     strictEqual(err, null);
      //   });
      //   //TODO: Simulate system exit or restart
      // });
      test('Should successfully initialize child directory for QcDownloadService requests', () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig, ccdbConfig);

        qcDlService.initTmpDir((err) => {
          if (err) {
            strictEqual(err, qcDlService._codes.CLEARED_CORPSES);
          } else {
            strictEqual(err, null);
          }
        });

        qcDlService.createNewRequestDir(REQ_ID);
        // strictEqual(fs.existsSync(TMP_REQ_DIR), true);
        setTimeout(() => {
          strictEqual(fs.existsSync(`${TMP_REQ_DIR}`), true);
        }, 100);

        setTimeout(() => {
          strictEqual(fs.existsSync(TMP_REQ_DIR), false);
        }, qcDlServiceConfig.dirLifespan + 500);
      });
      test('Should successfully download QCG objects based on ID', () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig, ccdbConfig);

        qcDlService.initTmpDir((err) => {
          if (err) {
            strictEqual(err, qcDlService._codes.CLEARED_CORPSES);
          } else {
            strictEqual(err, null);
          }
        });

        qcDlService.createNewRequestDir(REQ_ID);

        setTimeout(() => {
          qcDlService.sendDownloadRequest(CCDB_ETAG_TEST_PRIMARY, REQ_ID);
        }, 100);
        setTimeout(() => {
          strictEqual(fs.existsSync(`${TMP_REQ_DIR}/${CCDB_FILENAME_TEST_PRIMARY}`), true);
        }, 1000);
      });
      test('Should successfully create download multiple QCG objects', () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig, ccdbConfig);

        qcDlService.initTmpDir((err) => {
          if (err) {
            strictEqual(err, qcDlService._codes.CLEARED_CORPSES);
          } else {
            strictEqual(err, null);
          }
        });

        qcDlService.createNewRequestDir(REQ_ID);

        setTimeout(() => {
          qcDlService.sendDownloadRequests(CCDB_ETAG_TEST_ARRAY, REQ_ID);
        }, 100);
        setTimeout(() => {
          strictEqual(fs.existsSync(`${TMP_REQ_DIR}/${CCDB_FILENAME_TEST_PRIMARY}`), true);
        }, 1000);
        setTimeout(() => {
          strictEqual(fs.existsSync(`${TMP_REQ_DIR}/${CCDB_FILENAME_TEST_SECONDARY}`), true);
        }, 1000);
      });
      test('Should successfully create tarball of multiple QCG objects', async () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig, ccdbConfig);

        await qcDlService.initTmpDir((err) => {
          if (err) {
            strictEqual(err, qcDlService._codes.CLEARED_CORPSES);
          } else {
            strictEqual(err, null);
          }
        });

        qcDlService.createNewRequestDir(REQ_ID);

        setTimeout(() => {
          qcDlService.sendDownloadRequests(CCDB_ETAG_TEST_ARRAY, REQ_ID);
        }, 100);
        setTimeout(() => {
          strictEqual(fs.existsSync(`${TMP_REQ_DIR}/${CCDB_FILENAME_TEST_PRIMARY}`), true);
        }, 1000);
        setTimeout(() => {
          strictEqual(fs.existsSync(`${TMP_REQ_DIR}/${CCDB_FILENAME_TEST_SECONDARY}`), true);
        }, 1000);

        await qcDlService.retrieveFilesFromSubDir(REQ_ID, (err) => {
          if (err) {
            strictEqual(err, qcDlService._codes.NO_MATCHES);
          } else {
            strictEqual(err, null);
          }
        });

        setTimeout(() => {
          strictEqual(fs.existsSync(`${TMP_REQ_DIR}/${qcDlService.tarFileName}.tar`), true);
        }, 1000);
      });
    });
  });
};
