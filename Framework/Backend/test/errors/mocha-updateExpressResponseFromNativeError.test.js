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

/* eslint-disable max-len */
const {InvalidInputError} = require('../../errors/InvalidInputError.js');
const {NotFoundError} = require('../../errors/NotFoundError.js');
const {ServiceUnavailableError} = require('../../errors/ServiceUnavailableError.js');
const {TimeoutError} = require('../../errors/TimeoutError.js');
const {UnauthorizedAccessError} = require('../../errors/UnauthorizedAccessError.js');
const {updateAndSendExpressResponseFromNativeError} = require('../../errors/updateAndSendExpressResponseFromNativeError.js');

const assert = require('assert');
const sinon = require('sinon');

describe(`'updateAndSendExpressResponseFromNativeError' test suite`, function() {
  let response;
  before(() => {
    response = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    }
  });

  it('should successfully update response based on InvalidInputError', () => {
    updateAndSendExpressResponseFromNativeError(response, new InvalidInputError('Bad Parameters received'));
    assert.ok(response.status.calledWith(400));
    assert.ok(response.json.calledWith({status: 400, title: 'Invalid Input', message: 'Bad Parameters received'}));
  });
  it('should successfully update response based on UnauthorizedAccessError', () => {
    updateAndSendExpressResponseFromNativeError(response, new UnauthorizedAccessError('You shall not pass'));
    assert.ok(response.status.calledWith(403));
    assert.ok(response.json.calledWith({status: 403, title: 'Unauthorized Access', message: 'You shall not pass'}));
  });
  it('should successfully update response based on NotFoundError', () => {
    updateAndSendExpressResponseFromNativeError(response, new NotFoundError('Entity could not be found'));
    assert.ok(response.status.calledWith(404));
    assert.ok(response.json.calledWith({status: 404, title: 'Not Found', message: 'Entity could not be found'}));
  });
  it('should successfully update response based on TimeoutError', () => {
    updateAndSendExpressResponseFromNativeError(response, new TimeoutError('Ran out of time'));
    assert.ok(response.status.calledWith(408));
    assert.ok(response.json.calledWith({status: 408, title: 'Timeout', message: 'Ran out of time'}));
  });
  it('should successfully update response based on ServiceUnavailableError', () => {
    updateAndSendExpressResponseFromNativeError(response, new ServiceUnavailableError('Service does not want to cooperate'));
    assert.ok(response.status.calledWith(503));
    assert.ok(response.json.calledWith({status: 503, title: 'Service Unavailable', message: 'Service does not want to cooperate'}));
  });
  it('should successfully update response based on general Error', () => {
    updateAndSendExpressResponseFromNativeError(response, new Error('Some Error happened'));
    assert.ok(response.status.calledWith(500));
    assert.ok(response.json.calledWith({status: 500, title: 'Unknown Error', message: 'Some Error happened'}));
  });
});
