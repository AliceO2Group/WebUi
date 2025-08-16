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

import {di} from './../utilities/di.js';

/**
 * @file User role helper functions
 */

/**
 * Check if the user has needed role
 * @param {Role} role - role to check that user has
 * @param {boolean} strict - if true, the role must be exactly the same, otherwise it can be lower
 * @return {boolean} - true if user has the role
 */
export const isUserAllowedRole = (role, strict = false) => {
  if (strict) {
    return di.session.role === role
  } else {
    return di.session.role <= role;
  }
};
