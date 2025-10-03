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

import { strictEqual } from 'node:assert';
import { suite, test, before } from 'node:test';
import nock from 'nock';
import { QcdbDownloadService } from '../../../lib/services/QcdbDownload.service.js';

export const qcdbProxyServiceTestSuite = async () => {
  suite('CCDB Test Suite - ', () => {
    before(() => nock.cleanAll());

    suite('Creating a new QcdbProxy instance', () => {
      test('should successfully initialize QcdbProxyService', () => {
        const qcdbProxyService = new QcdbDownloadService
        ({ hostname: 'ccdb-local', port: 8083, protocol: 'https', prefix: 'qc/' });

        strictEqual(qcdbProxyService._hostname, 'ccdb-local');
        strictEqual(qcdbProxyService._port, 8083);
        strictEqual(qcdbProxyService._protocol, 'https');
      });

      test('should successfully initialize QcdbProxy with default values', () => {
        const qcdbProxyService = new QcdbDownloadService();

        strictEqual(qcdbProxyService._hostname, 'localhost');
        strictEqual(qcdbProxyService._port, 8080);
        strictEqual(qcdbProxyService._protocol, 'http');
      });
    });
  });
};
