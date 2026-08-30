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

import { suite, test } from 'node:test';
import { OWNER_TEST_TOKEN, URL_ADDRESS } from '../config.js';
import request from 'supertest';
import { downloadMockLayout1 } from '../../demoData/layout/downloadLayout.mock.js';
import { deepStrictEqual } from 'assert';

export const apiPostDownloadTests = () => {
  suite('POST /download', () => {
    test('should return a GUID key', async () => {
      const layoutBody = downloadMockLayout1;
      await request(`${URL_ADDRESS}/api/download`)
        .post(`?token=${OWNER_TEST_TOKEN}&user_id=1`)
        .send(layoutBody)
        .expect(201)
        .expect((res) => deepStrictEqual(res.text?.length, 36));
    });

    test('should NOT return a GUID key', async () => {
      await request(`${URL_ADDRESS}/api/download`)
        .post(`?token=${OWNER_TEST_TOKEN}`)
        .send({ hello: 'world' })
        .expect(400)
        .expect((res) => deepStrictEqual(res.text, 'Could not save download data'));
    });
  });
};
