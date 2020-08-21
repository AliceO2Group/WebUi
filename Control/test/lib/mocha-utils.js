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

const sinon = require('sinon');
const assert = require('assert');
const errorHandler = require('./../../lib/utils.js').errorHandler;

describe('Check errors are handled and sent successfully', () => {
  let res;

  beforeEach(() => {
    res = {
      status: sinon.fake.returns(),
      send: sinon.fake.returns(true)
    };
  });

  it('should successfully respond with built error message when there is a message and no status', () => {
    errorHandler('Error', res);
    assert.ok(res.status.calledOnce);
  });

  it('should successfully respond with built error message and status > 500', () => {
    errorHandler('Error', res, 502);
    assert.ok(res.status.calledWith(502));
  });

  it('should successfully respond with built error message and status < 500', () => {
    errorHandler('Error', res, 404);
    assert.ok(res.status.calledWith(404));
  });


  it('should successfully respond with built error.message and status', () => {
    const err = {
      message: 'Test Error',
      stack: 'Some Stack'
    };
    errorHandler(err, res, 502);
    assert.ok(res.status.calledWith(502));
    assert.ok(res.send.calledWith({message: 'Test Error'}));
  });

  it('should successfully respond with built error.message, no stack and status', () => {
    const err = 'Test Error';
    errorHandler(err, res, 404);
    assert.ok(res.status.calledWith(404));
    assert.ok(res.send.calledWith({message: 'Test Error'}));
  });
});
