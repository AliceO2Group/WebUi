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

const {NotFoundError} = require('./NotFoundError.js');
const {InvalidInputError} = require('./InvalidInputError.js');
const {TimeoutError} = require('./TimeoutError.js');

/**
 * Convert a gRPC error to native error
 * Code List source: https://grpc.github.io/grpc/core/md_doc_statuscodes.html
 *
 * @param {gRPCError} error - error object from gRPC Client library
 * @returns {Error}
 */
const grpcErrorToNativeError = (error) => {
  const { code, message } = error;

  switch (code) {
    case 3:
      return new InvalidInputError(message);
    case 4:
      return new TimeoutError(message);
    case 5:
      return new NotFoundError(message);
    default:
      return new Error(message);
  }
};

exports.grpcErrorToNativeError = grpcErrorToNativeError;
