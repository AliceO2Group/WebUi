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
 * Middleware to check if user has the needed roles for the operation;
 * {
  personid: 0,
  username: 'anonymous',
  name: 'Anonymous',
  access: 'admin'
}
 *
 * @param {{allowed: Array<string>, forbidden: Array<string>}} roles - object with list of allowed roles or forbidden
 * @return {(function(*, *, *): void)} the rbac middleware
 */
export function roleCheckMiddleware({allowed = [], forbidden = []}) {
  return (req, res, next) => {
    let userRoles = req?.session?.access || [];

    if (!Array.isArray(userRoles)) {
      userRoles = [userRoles];
    }

    const isAllowed = userRoles.some((userRole) => allowed.includes(userRole));
    const hasForbiddenRoles = userRoles.some((userRole) => forbidden.includes(userRole));

    if (isAllowed && !hasForbiddenRoles) {
      next();
    } else {
      res.status(403).json({message: 'Access Forbidden'});
    }
  };
}
