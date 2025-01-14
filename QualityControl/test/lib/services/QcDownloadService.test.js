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

import { strictEqual } from 'node:assert';
import { suite, test, before } from 'node:test';
import nock from 'nock';

import { CcdbService } from '../../../lib/services/ccdb/CcdbService.js';
import { QcDownloadService } from '../../../lib/services/QcDownload.service.js';

import fs from 'fs';
const fsp = fs.promises;
import os from 'os';

const ccdbConfig = {
  hostname: 'ccdb-test.cern.ch',
  port: 8080,
  protocol: 'http',
  prefix: 'qc-test',
};

const qcDlServiceConfig = {
  tarFileName: 'download',
  cleanUpEvent: 'exit',
  dirLifespan: 5000,
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
  suite('QC Download Test Suite - ', () => {
    before(() => {
      nock.cleanAll();
      if (fs.existsSync(TMP_DIR)) {
        fsp.rm(TMP_DIR, { recursive: true });
      }
    });

    suite('Creating a new QcDownloadService instance', () => {
      test('Should successfully initialize QcDownloadService', () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig);
        const ccdbService = new CcdbService(ccdbConfig);

        strictEqual(ccdbService._ccdbServerUrl, 'http://ccdb-test.cern.ch:8080');
        strictEqual(qcDlService.tarFileName, 'download');
        strictEqual(qcDlService.cleanUpEvent, 'exit');
      });
    });

    suite('Initializing a new QcDownloadService download', () => {
      test('Should successfully initialize temporary root directory for QcDownloadService', () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig);

        qcDlService.initTmpDir((msg) => {
          if (msg) {
            strictEqual(msg, qcDlService._codes.CLEARED_CORPSES);
          }
        });

        setTimeout(() => {
          strictEqual(fs.existsSync(TMP_DIR), true); //Directory should have been created
        }, 1000);
      });
      test('Should successfully initialize child directory for QcDownloadService requests', () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig);

        qcDlService.initTmpDir((msg) => {
          if (msg) {
            strictEqual(msg, qcDlService._codes.CLEARED_CORPSES);
          }
        }).then(() => {
          qcDlService.createNewRequestDir(REQ_ID).then(() => {
            strictEqual(fs.existsSync(`${TMP_REQ_DIR}`), true);
          }).then(() => {
            setTimeout(() => {
              strictEqual(fs.existsSync(TMP_REQ_DIR), false);
            }, qcDlServiceConfig.dirLifespan + 500);
          });
        });
      });

      test('Should successfully download QCG objects based on ID', () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig);
        const ccdbService = new CcdbService(ccdbConfig);

        qcDlService.initTmpDir((msg) => {
          if (msg) {
            strictEqual(msg, qcDlService._codes.CLEARED_CORPSES);
          }
        }).then(() => {
          qcDlService.createNewRequestDir(REQ_ID).then(() => {
            ccdbService.sendDownloadRequest(CCDB_ETAG_TEST_PRIMARY, REQ_ID).then(() => {
              setTimeout(() => {
                strictEqual(fs.existsSync(`${TMP_REQ_DIR}/${CCDB_ETAG_TEST_PRIMARY}.root`), true);
              }, 1000);
            });
          });
        });
      });

      test('Should not archive a singular root file', () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig);
        const ccdbService = new CcdbService(ccdbConfig);

        qcDlService.initTmpDir((msg) => {
          if (msg) {
            strictEqual(msg, qcDlService._codes.CLEARED_CORPSES);
          }
        }).then(() => {
          setTimeout(() => { //TODO:A FIX DIR NOT BEING DELETED
            qcDlService.createNewRequestDir(REQ_ID).then(() => {
              ccdbService.sendDownloadRequest(CCDB_ETAG_TEST_PRIMARY, REQ_ID).finally(() => {
                setTimeout(() => {
                  strictEqual(fs.existsSync(`${TMP_REQ_DIR}/${CCDB_ETAG_TEST_PRIMARY}.root`), true);
                }, 1000);

                qcDlService.retrieveFilesFromSubDir(REQ_ID, (msg) => {
                  if (msg) {
                    console.log(`Test ${qcDlService._codes.UNNECESSARY_ARCHIVE}: ${msg}`);
                    strictEqual(msg, qcDlService._codes.UNNECESSARY_ARCHIVE);
                  }
                }).then(() => {
                  setTimeout(() => {
                    if (fs.readdirSync(TMP_REQ_DIR).length > 0) {
                      console.log(fs.readdirSync(TMP_REQ_DIR));
                    }
                    console.log(`Test ${TMP_REQ_DIR}/${qcDlService.tarFileName}.tar exists: ${fs.existsSync(`${TMP_REQ_DIR}/${qcDlService.tarFileName}.tar`)}`)
                    strictEqual(fs.existsSync(`${TMP_REQ_DIR}/${qcDlService.tarFileName}.tar`), false);
                  }, 1000);
                });
              });
            });
          }, 1000);
        });
      });

      test('Should successfully download multiple QCG objects', () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig);
        const ccdbService = new CcdbService(ccdbConfig);

        qcDlService.initTmpDir((msg) => {
          if (msg) {
            strictEqual(msg, qcDlService._codes.CLEARED_CORPSES);
          }
        }).then(() => {
          qcDlService.createNewRequestDir(REQ_ID).then(() => {
            ccdbService.sendDownloadRequests(CCDB_ETAG_TEST_ARRAY, REQ_ID).finally(() => {
              setTimeout(() => {
                strictEqual(fs.existsSync(`${TMP_REQ_DIR}/${CCDB_ETAG_TEST_PRIMARY}.root`), true);
                strictEqual(fs.existsSync(`${TMP_REQ_DIR}/${CCDB_ETAG_TEST_SECONDARY}.root`), true);
              }, 1000);
            });
          });
        });
      });

      test('Should successfully create tarball of multiple QCG objects', () => {
        const qcDlService = new QcDownloadService(qcDlServiceConfig);
        const ccdbService = new CcdbService(ccdbConfig);

        qcDlService.initTmpDir((msg) => {
          if (msg) {
            strictEqual(msg, qcDlService._codes.CLEARED_CORPSES);
          }
        }).then(() => {
          qcDlService.createNewRequestDir(REQ_ID).then(() => {
            ccdbService.sendDownloadRequests(CCDB_ETAG_TEST_ARRAY, REQ_ID).then(() => {
              setTimeout(() => {
                strictEqual(fs.existsSync(`${TMP_REQ_DIR}/${CCDB_ETAG_TEST_PRIMARY}.root`), true);
              }, 1000);
              setTimeout(() => {
                strictEqual(fs.existsSync(`${TMP_REQ_DIR}/${CCDB_ETAG_TEST_SECONDARY}.root`), true);
              }, 1000);
            }).then(() => {
              qcDlService.retrieveFilesFromSubDir(REQ_ID, (msg) => {
                if (msg) {
                  strictEqual(msg, qcDlService._codes.NO_MATCHES); //Gives error Singular match
                }
              }).then(() => {
                setTimeout(() => {
                  strictEqual(fs.existsSync(`${TMP_REQ_DIR}/${qcDlService.tarFileName}.tar`), true);
                }, 1000);
              });
            });
          });
        });
      });
    });
  });
};
