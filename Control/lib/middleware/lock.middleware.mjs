/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

/**
 * Log middleware for user-triggered events;
 *
 * @param {string} action - user-event that needs logging
 * @returns {(function(*, *, *): void)}
 */
export function lockOwnershipMiddleware(lockService, operation = '') {
  return (req, res, next) => {
    const {username} = req.session;
    const {detectors = []} = req.body;

    if (!lockService.hasLocks(username, detectors)) {
      res.status(403).json(
        {message: `Operation ${operation} not allowed for user ${username} due to missing ownership of lock(s)`}
      );
    }

    next();
  };
}
