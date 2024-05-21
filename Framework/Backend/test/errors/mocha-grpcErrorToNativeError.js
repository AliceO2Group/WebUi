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
const {grpcErrorToNativeError} = require('../../errors/grpcErrorToNativeError.js');
const {InvalidInputError} = require('../../errors/InvalidInputError.js');
const {NotFoundError} = require('../../errors/NotFoundError.js');
const {ServiceUnavailableError} = require('../../errors/ServiceUnavailableError.js');
const {TimeoutError} = require('../../errors/TimeoutError.js');
const {UnauthorizedAccessError} = require('../../errors/UnauthorizedAccessError.js');

const assert = require('assert');

describe(`'grpcErrorToNativeError' test suite`, function() {
  it('should successfully convert gRPC errors to native errors', () => {
    assert.deepStrictEqual(grpcErrorToNativeError({code: 3, message: 'invalid'}), new InvalidInputError('invalid'));
    assert.deepStrictEqual(grpcErrorToNativeError({code: 4, message: 'timeout'}), new TimeoutError('timeout'));
    assert.deepStrictEqual(grpcErrorToNativeError({code: 5, message: 'not-found'}), new NotFoundError('not-found'));
    assert.deepStrictEqual(grpcErrorToNativeError({code: 7, message: 'unauthorized'}), new UnauthorizedAccessError('unauthorized'));
    assert.deepStrictEqual(grpcErrorToNativeError({code: 14, message: 'service-unavailable'}), new ServiceUnavailableError('service-unavailable'));
    assert.deepStrictEqual(grpcErrorToNativeError({code: 100, message: 'standard-error'}), new Error('standard-error'));
    assert.deepStrictEqual(grpcErrorToNativeError({message: 'standard-error'}), new Error('standard-error'));
  })
});
