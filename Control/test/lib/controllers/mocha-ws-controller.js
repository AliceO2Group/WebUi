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
const sinon = require('sinon');
const {WebSocketService} = require('./../../../lib/services/WebSocket.service.js');

const {SERVICES: {STATUS}} = require('./../../../lib/common/constants.js');


describe('WebSocket Service Test Suite', () => {
  it('should successfully send data only when it is different on update', async () =>{
    const ws = { broadcast: sinon.spy() };
    const wsCtrl = new WebSocketService(ws);
    wsCtrl.updateData(STATUS, 'aliecs-core', {ok: true, configured: true});
    wsCtrl.updateData(STATUS, 'aliecs-core', {ok: true, configured: true});
    wsCtrl.updateData(STATUS, 'aliecs-core', {ok: false, configured: true});

    assert.ok(ws.broadcast.calledTwice);
  });
});