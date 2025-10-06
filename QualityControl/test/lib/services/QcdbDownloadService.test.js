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
import { Buffer } from 'node:buffer';
import nock from 'nock';
import { QcdbDownloadService } from '../../../lib/services/QcdbDownload.service.js';
import { promisify } from 'node:util';
import fs from 'node:fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sinon from 'sinon';
import { PassThrough } from 'node:stream';

export const qcdbDownloadServiceTestSuite = async () => {
  suite('CCDB Test Suite - ', () => {
    before(() => {
      nock.cleanAll();
    });

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

      test('should successfully return a Root file when requested.', async () => {
        const _filename = fileURLToPath(import.meta.url);
        const _dirname = dirname(_filename);
        const filePath = join(_dirname, '../../demoData/qcdbRoot/TObject_1732326337752.root');
        const qcdbProxyService = new QcdbDownloadService({ hostname: 'ccdb-loctest', port: 8083, protocol: 'http' });
        const readfile = promisify(fs.readFile);

        nock('http://ccdb-loctest:8083')
          .replyContentLength()
          .get('/download/a379543d-a93c-11ef-9af4-0aa14016a1a2')
          .replyWithFile(200, filePath, {
            'Content-Type': 'application/root',
          });

        const reply = await qcdbProxyService.requestObject('a379543d-a93c-11ef-9af4-0aa14016a1a2');
        const testBuffer = await readfile(filePath);
        const testFile = new File([testBuffer], 'TObject_1732326337752.root');
        strictEqual(await reply.text(), await testFile.text());
      });

      test('should successfully answer with Root file when requested.', async () => {
        const resMock = new PassThrough();
        resMock.status = sinon.stub().returnsThis();
        resMock.send = sinon.spy();
        resMock.json = sinon.spy();
        resMock.body = sinon.spy();
        resMock.setHeader = sinon.stub();

        let data = Buffer.alloc(0);

        resMock.on('data', (d) => {
          data = Buffer.concat([data, d]);
        });
        // const resMock = {
        //   status: sinon.stub().returnsThis(),
        //   send: sinon.spy(),
        //   json: sinon.spy(),
        //   body: '',
        //   setHeader: sinon.stub(),
        // };
        const _filename = fileURLToPath(import.meta.url);
        const _dirname = dirname(_filename);
        const filePath = join(_dirname, '../../demoData/qcdbRoot/TObject_1732326337752.root');
        const qcdbProxyService = new QcdbDownloadService({ hostname: 'ccdb-loctest', port: 8083, protocol: 'http' });
        const readfile = promisify(fs.readFile);

        nock('http://ccdb-loctest:8083')
          .replyContentLength()
          .get('/download/a379543d-a93c-11ef-9af4-0aa14016a1a2')
          .replyWithFile(200, filePath, {
            'Content-Type': 'application/root',
          });
        await qcdbProxyService.requestObject('a379543d-a93c-11ef-9af4-0aa14016a1a2', resMock);
        const testBuffer = await readfile(filePath);
        const testFile = new File([testBuffer], 'TObject_1732326337752.root');
        const resultFile = new File([data], 'TObject_1732326337752.root');
        strictEqual(await resultFile.text(), await testFile.text());
      });
    });
  });
};
