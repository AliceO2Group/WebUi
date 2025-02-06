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

const { InvalidInputError } = require('./InvalidInputError.js');
const { NotFoundError } = require('./NotFoundError.js');
const { ServiceUnavailableError } = require('./ServiceUnavailableError.js');
const { TimeoutError } = require('./TimeoutError.js');
const { UnauthorizedAccessError } = require('./UnauthorizedAccessError.js');
const { GrpcErrorCodes } = require('./grpcErrorCodes.enum.js');

/**
 * @typedef GrpcError
 * also known as gRPC Status Object https://grpc.github.io/grpc/node/grpc.html#~StatusObject
 *
 * @property {GrpcErrorCodes} code - code of the gRPC Status object
 * @property {string} details - details of the gRPC Status object
 * @property {string} message - message of the gRPC Status object
 */

/**
 * Convert a gRPC error to native error
 * Code List source: https://grpc.github.io/grpc/core/md_doc_statuscodes.html
 *
 * @param {GrpcError} error - error object from gRPC Client library
 * @param {Boolean} includeStatusCode - whether to error message field or details field
 * @returns {Error}
 */
const grpcErrorToNativeError = (error, includeStatusCode = false) => {
  const { code, details, message } = error;

  switch (code) {
    case GrpcErrorCodes.INVALID_INPUT:
      return new InvalidInputError(includeStatusCode ? message : details);
    case GrpcErrorCodes.TIMEOUT:
      return new TimeoutError(includeStatusCode ? message : details);
    case GrpcErrorCodes.NOT_FOUND:
      return new NotFoundError(includeStatusCode ? message : details);
    case GrpcErrorCodes.UNAUTHORIZED_ACCESS:
      return new UnauthorizedAccessError(includeStatusCode ? message : details);
    case GrpcErrorCodes.SERVICE_UNAVAILABLE:
      return new ServiceUnavailableError(includeStatusCode ? message : details);
    default:
      return new Error(includeStatusCode ? message : details);
  }
};

exports.grpcErrorToNativeError = grpcErrorToNativeError;
