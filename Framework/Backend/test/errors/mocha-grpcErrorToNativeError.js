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

const { grpcErrorToNativeError } = require('../../errors/grpcErrorToNativeError.js');
const { InvalidInputError } = require('../../errors/InvalidInputError.js');
const { NotFoundError } = require('../../errors/NotFoundError.js');
const { ServiceUnavailableError } = require('../../errors/ServiceUnavailableError.js');
const { TimeoutError } = require('../../errors/TimeoutError.js');
const { UnauthorizedAccessError } = require('../../errors/UnauthorizedAccessError.js');

const assert = require('assert');

describe('\'grpcErrorToNativeError\' test suite', () => {
  it('should successfully convert gRPC errors to native errors', () => {
    assert.deepStrictEqual(
      grpcErrorToNativeError({ code: 3, message: '3: invalid', details: 'invalid' }),
      new InvalidInputError('invalid'),
    );
    assert.deepStrictEqual(
      grpcErrorToNativeError({ code: 4, message: '4: timeout', details: 'timeout' }),
      new TimeoutError('timeout'),
    );
    assert.deepStrictEqual(
      grpcErrorToNativeError({ code: 5, message: '5: not-found', details: 'not-found' }),
      new NotFoundError('not-found'),
    );
    assert.deepStrictEqual(
      grpcErrorToNativeError({ code: 7, message: 'unauthorized', details: 'unauthorized' }),
      new UnauthorizedAccessError('unauthorized'),
    );
    assert.deepStrictEqual(
      grpcErrorToNativeError({ code: 14, message: 'service-unavailable', details: 'service-unavailable' }),
      new ServiceUnavailableError('service-unavailable'),
    );
    assert.deepStrictEqual(
      grpcErrorToNativeError({ code: 100, message: 'standard-error', details: 'standard-error' }),
      new Error('standard-error'),
    );
    assert.deepStrictEqual(
      grpcErrorToNativeError({ message: 'standard-error', details: 'standard-error' }),
      new Error('standard-error'),
    );
  });

  it('should successfully convert gRPC errors to native errors', () => {
    assert.deepStrictEqual(
      grpcErrorToNativeError({ code: 3, message: '3: invalid', details: 'invalid' }, true),
      new InvalidInputError('3: invalid'),
    );
    assert.deepStrictEqual(
      grpcErrorToNativeError({ code: 4, message: '4: timeout', details: 'timeout' }, true),
      new TimeoutError('4: timeout'),
    );
    assert.deepStrictEqual(
      grpcErrorToNativeError({ code: 5, message: '5: not-found', details: 'not-found' }, true),
      new NotFoundError('5: not-found'),
    );
    assert.deepStrictEqual(
      grpcErrorToNativeError({ code: 7, message: '7: unauthorized', details: 'unauthorized' }, true),
      new UnauthorizedAccessError('7: unauthorized'),
    );
    assert.deepStrictEqual(
      grpcErrorToNativeError({ code: 14, message: '14: service-unavailable', details: 'service-unavailable' }, true),
      new ServiceUnavailableError('14: service-unavailable'),
    );
    assert.deepStrictEqual(
      grpcErrorToNativeError({ code: 100, message: '100: standard-error', details: 'standard-error' }, true),
      new Error('100: standard-error'),
    );
    assert.deepStrictEqual(
      grpcErrorToNativeError({ message: 'code: standard-error', details: 'standard-error' }, true),
      new Error('code: standard-error'),
    );
  });
});
