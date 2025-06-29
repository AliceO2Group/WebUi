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

const nock = require('nock');
const config = require('../test-config');

const CONSUL_URL = `http://${config.consul.hostname}:${config.consul.port}`;
const KV_PATH = '/v1/kv/';

/**
 * Setup nock environment to intercept requests to the Consul API.
 */
const initializeNockForConsul = () => {
  nock(CONSUL_URL)
    .persist()
    .get('/v1/status/leader')
    .reply(200, 'http://localhost:8550');

  nock(CONSUL_URL)
    .persist()
    .get(`${KV_PATH}${config.consul.qcPath}/ANY/any?recurse=true`)
    .reply(200, JSON.stringify([
      {
        LockIndex: 0,
        Key: "key1",
        Flags: 0,
        Value: Buffer.from(JSON.stringify({key1: "value1"})).toString('base64'),
        CreateIndex: 1,
        ModifyIndex: 1
      }
    ]))
  
  nock(CONSUL_URL)
    .persist()
    .get(`${KV_PATH}key1?raw=true`)
    .reply(200, JSON.stringify({key: "value"}))
}

module.exports = {
  initializeNockForConsul
};