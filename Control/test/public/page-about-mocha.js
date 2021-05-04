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

const assert = require('assert');
const test = require('../mocha-index');

describe('`pageAbout` test-suite', async () => {
  let url;
  let page;
  let calls;

  before(async () => {
    url = test.helpers.url;
    page = test.page;
    calls = test.helpers.calls;
  });

  beforeEach(() => {
    // reset grpc calls
    calls['getFrameworkInfo'] = undefined;
  });

  it('should load about page', async () => {
    await page.goto(url + '?page=about', {waitUntil: 'networkidle0'});
    await page.waitForTimeout(500);
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(calls['getFrameworkInfo'], true);
    assert.strictEqual(location.search, '?page=about');
  });

  it('should request info about Core and store in frameworkInfo.statuses as RemoteData', async () => {
    const core = await page.evaluate(() => window.model.frameworkInfo.statuses['kafka']);
    assert.strictEqual(core.kind, 'Success', 'No information was passed regarding kafka');
    assert.ok(!core.payload.status.ok);
  });

  it('should request info about GUI and store in frameworkInfo.statuses as RemoteData', async () => {
    const gui = await page.evaluate(() => window.model.frameworkInfo.statuses.gui);
    assert.strictEqual(gui.kind, 'Success', 'No information was passed regarding GUI');
    assert.ok(gui.payload.status.ok)
  });

  it('should request info about Grafana and store in frameworkInfo.statuses as RemoteData', async () => {
    const grafana = await page.evaluate(() => window.model.frameworkInfo.statuses.grafana);
    assert.strictEqual(grafana.kind, 'Success', 'No information was passed regarding Grafana');
  });

  it('should request info about Kafka and store in frameworkInfo.statuses as RemoteData', async () => {
    const kafka = await page.evaluate(() => window.model.frameworkInfo.statuses.kafka);
    assert.strictEqual(kafka.kind, 'Success', 'No information was passed regarding Kafka');
  });

  it('should request info about Consul and store in frameworkInfo.statuses as RemoteData', async () => {
    const consul = await page.evaluate(() => window.model.frameworkInfo.statuses.consul);
    assert.strictEqual(consul.kind, 'Success', 'No information was passed regarding Consul');
  });
});
