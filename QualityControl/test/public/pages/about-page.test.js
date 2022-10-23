/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */
/* eslint-disable max-len */

import { strictEqual, deepStrictEqual } from 'assert';
import test from '../index';

describe('about page test suite', async () => {
  let page;
  let url;

  before(async () => ({ url, page } = test));

  it('should load', async () => {
    await page.goto(`${url}?page=about`, { waitUntil: 'networkidle0' });
    const location = await page.evaluate(() => window.location);
    strictEqual(location.search, '?page=about');
  });

  it('should have a frameworkInfo item with config fields', async () => {
    const expConfig = {
      qcg: { port: 8181, hostname: 'localhost', status: { ok: true } },
      consul: { hostname: 'localhost', port: 8500, status: { ok: false, message: 'Live Mode was not configured' } },
      ccdb: { hostname: 'ccdb', port: 8500, prefix: 'test', status: { ok: false, message: 'Data connector was not configured' } },
      quality_control: { version: '0.19.5-1' },
    };
    const config = await page.evaluate(() => window.model.frameworkInfo.item);
    delete config.payload.qcg.version;
    deepStrictEqual(config.payload, expConfig);
  });
});
