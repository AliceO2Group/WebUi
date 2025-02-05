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

const { grpcErrorToNativeError } = require('../../errors/grpcErrorToNativeError.js');
const { GrpcErrorCodes: {
  INVALID_INPUT, TIMEOUT, NOT_FOUND, UNAUTHORIZED_ACCESS, SERVICE_UNAVAILABLE, UNKNOWN,
} } = require('../../errors/grpcErrorCodes.enum.js');
const { InvalidInputError } = require('../../errors/InvalidInputError.js');
const { NotFoundError } = require('../../errors/NotFoundError.js');
const { ServiceUnavailableError } = require('../../errors/ServiceUnavailableError.js');
const { TimeoutError } = require('../../errors/TimeoutError.js');
const { UnauthorizedAccessError } = require('../../errors/UnauthorizedAccessError.js');

describe('\'grpcErrorToNativeError\' test suite', () => {
  const testCases = [
    {
      grpcError: { code: UNKNOWN, message: `${UNKNOWN}: Error is unknown`, details: 'Error is unknown' },
      expectedError: Error,
      expectedMessage: `${UNKNOWN}: Error is unknown`,
      expectedDetails: 'Error is unknown',
    },
    {
      grpcError: { code: INVALID_INPUT, message: `${INVALID_INPUT}: Invalid input details`, details: 'Invalid input details' },
      expectedError: InvalidInputError,
      expectedMessage: `${INVALID_INPUT}: Invalid input details`,
      expectedDetails: 'Invalid input details',
    },
    {
      grpcError: { code: TIMEOUT, message: `${TIMEOUT}: Timeout occurred`, details: 'Timeout occurred' },
      expectedError: TimeoutError,
      expectedMessage: `${TIMEOUT}: Timeout occurred`,
      expectedDetails: 'Timeout occurred',
    },
    {
      grpcError: { code: NOT_FOUND, message: `${NOT_FOUND}: Not found`, details: 'Not found' },
      expectedError: NotFoundError,
      expectedMessage: `${NOT_FOUND}: Not found`,
      expectedDetails: 'Not found',
    },
    {
      grpcError: { code: UNAUTHORIZED_ACCESS, message: `${UNAUTHORIZED_ACCESS}: Unauthorized access`, details: 'Unauthorized access details' },
      expectedError: UnauthorizedAccessError,
      expectedMessage: `${UNAUTHORIZED_ACCESS}: Unauthorized access`,
      expectedDetails: 'Unauthorized access details',
    },
    {
      grpcError: { code: SERVICE_UNAVAILABLE, message: `${SERVICE_UNAVAILABLE}: Service unavailable`, details: 'Service unavailable details' },
      expectedError: ServiceUnavailableError,
      expectedMessage: `${SERVICE_UNAVAILABLE}: Service unavailable`,
      expectedDetails: 'Service unavailable details',
    },
    {
      grpcError: { code: 100, message: '100: Unknown Code and Error', details: 'Unknown Code and Error' },
      expectedError: Error,
      expectedMessage: '100: Unknown Code and Error',
      expectedDetails: 'Unknown Code and Error',
    },
  ];

  testCases.forEach(({ grpcError: { code, details }, expectedError, expectedDetails }) => {
    it(`should convert gRPC error with code ${code} and pass DETAILS in error of type ${expectedError}`, () => {
      assert.deepStrictEqual(grpcErrorToNativeError({ code, details }), new expectedError(expectedDetails));
    });
  });

  testCases.forEach(({ grpcError: { code, message }, expectedError, expectedMessage }) => {
    it(`should convert gRPC error with code ${code} and pass MESSAGE in error of type ${expectedError.name}`, () => {
      assert.deepStrictEqual(grpcErrorToNativeError({ code, message }, true), new expectedError(expectedMessage));
    });
  });

  it('should handle gRPC error with unknown code gracefully', () => {
    assert.deepStrictEqual(grpcErrorToNativeError({ code: 999, details: 'unknown-error' }), new Error('unknown-error'));
  });

  it('should handle gRPC error without message gracefully', () => {
    assert.deepStrictEqual(grpcErrorToNativeError({ code: 3 }), new InvalidInputError(''));
  });
});
