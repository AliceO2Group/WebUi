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

const {InvalidInputError} = require('./InvalidInputError.js');
const {NotFoundError} = require('./NotFoundError.js');
const {ServiceUnavailableError} = require('./ServiceUnavailableError.js');
const {TimeoutError} = require('./TimeoutError.js');
const {UnauthorizedAccessError} = require('./UnauthorizedAccessError.js');

/**
 * Given an Express response object and an error, use the response object to set a custom status code and send the message
 *
 * @param {Response} response - express response to be used
 * @param {InvalidInputError|UnauthorizedError|NotFoundError|TimeoutError|ServiceUnavailableError} error - the error instance to handle
 * @returns {void}
 */
const updateAndSendExpressResponseFromNativeError = (response, error) => {
  let status = 500;
  let title = 'Unknown Error';
  const {message, constructor} = error;
  switch (constructor) {
    case InvalidInputError:
      status = 400;
      title = 'Invalid Input';
      break;
    case UnauthorizedAccessError:
      status = 403;
      title = 'Unauthorized Access';
      break;
    case NotFoundError:
      status = 404;
      title = 'Not Found';
      break;
    case TimeoutError:
      status = 408;
      title = 'Timeout';
      break;
    case ServiceUnavailableError:
      status = 503;
      title = 'Service Unavailable';
      break;
  }

  response.status(status).json({ errors: [{ status, title, detail: message || 'An error has occurred' }] });
};

exports.updateAndSendExpressResponseFromNativeError = updateAndSendExpressResponseFromNativeError;
