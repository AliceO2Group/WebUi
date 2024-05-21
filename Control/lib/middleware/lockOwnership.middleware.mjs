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
 * Middleware function to check that the user has ownership of the locks for the given detectors
 *
 * @param {LockService} lockService - service to be used to check ownership of locks
 * @returns {(function(*, *, *): void)}
 */
export function lockOwnershipMiddleware(lockService) {
  return (req, res, next) => {
    const {username} = req.session;
    const {detectors = []} = req.body;

    if (!lockService.hasLocks(username, detectors)) {
      res.status(403).json({message: `Action not allowed for user ${username} due to missing ownership of lock(s)`});
    }

    next();
  };
}
