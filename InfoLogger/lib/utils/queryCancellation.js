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

/**
 * Custom error class for query cancellation
 */
class AbortError extends Error {
  /**
   * Create an AbortError
   * @param {string} message - error message
   */
  constructor(message = 'Query cancelled by client') {
    super(message);
    this.name = 'AbortError';
    this.code = 'QUERY_CANCELLED';
  }
}

/**
 * Throw an error if the given signal is already aborted.
 * @param {AbortSignal|null} signal - optional abort signal
 * @throws {AbortError} if signal is aborted
 */
const throwIfQueryAborted = (signal) => {
  if (signal?.aborted) {
    throw new AbortError();
  }
};

/**
 * Attach a one-time abort handler to the signal that destroys the connection.
 * Return a cleanup function to remove the listener
 * @param {AbortSignal|null} signal - optional abort signal
 * @param {object} connection - mariadb connection-like object
 * @param {function(): void} onDestroyed - callback called just before destroying connection
 * @returns {function(): void} cleanup callback to remove the listener
 */
const attachAbortDestroyHandler = (signal, connection, onDestroyed) => {
  if (!signal) {
    return () => {};
  }

  const abortHandler = () => {
    onDestroyed();
    connection.destroy();
  };

  signal.addEventListener('abort', abortHandler, { once: true });
  return () => signal.removeEventListener('abort', abortHandler);
};

module.exports = {
  AbortError,
  throwIfQueryAborted,
  attachAbortDestroyHandler,
};
