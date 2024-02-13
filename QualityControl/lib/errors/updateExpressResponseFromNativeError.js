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

import { UnauthorizedAccessError } from './UnauthorizedAccessError.js';
import { InvalidInputError } from './InvalidInputError.js';
import { NotFoundError } from './NotFoundError.js';

/**
 * Update (in place) the given Express response considering a given error
 * If the error is specific, the response status may be set to a specific error code
 *
 * @param {Response} response - express response to be used
 * @param {Error} error - the error instance to handle
 * @returns {void}
 */
export const updateExpressResponseFromNativeError = (response, error) => {
  let status = 500;
  const { message, constructor } = error;
  switch (constructor) {
    case InvalidInputError:
      status = 400;
      break;
    case UnauthorizedAccessError:
      status = 403;
      break;
    case NotFoundError:
      status = 404;
      break;
  }
  response.status(status).json({ message });
};
