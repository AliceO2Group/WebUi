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

const Role = Object.freeze({
  ADMIN: 1,
  GLOBAL: 10,
  DETECTOR: 30, // roles for this level will be in format of `det-<name>` e.g. `det-its`
  DEFAULT_ROLE: 50,
  GUEST: 100,
});

/**
 * Method to check if the provided access as per WebUI server is stronger than the minimum required role
 * @param {string} roleName - admin, global, det-, guest
 * @param {Role} minimumRole - minimum role that user should have
 * @returns {boolean}
 */
const isRoleSufficient = (roleName, minimumRole) => {
  const roleInUpperCase = roleName.toLocaleUpperCase();
  const isDetectorRole = roleInUpperCase.startsWith('DET-');
  const isDefaultRole = roleInUpperCase.startsWith('DEFAULT-');

  let role;
  if (isDetectorRole) {
    role = Role.DETECTOR;
  } else if (isDefaultRole) {
    role = Role.DEFAULT_ROLE;
  } else if (Role[roleInUpperCase]) {
    role = Role[roleInUpperCase];
  }
  return role <= minimumRole;
};

exports.Role = Role;

exports.isRoleSufficient = isRoleSufficient;
