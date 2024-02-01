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

const assert = require('assert');
const {Role, isWithinRole} = require("../../../lib/common/role.enum");

describe('`Role Enum` test suite, needed to ensure no change in Roles hierarchy', () => {
  it('should successfully return the hierarchy of roles', () => {
    assert.deepStrictEqual(Role, {
      ADMIN: 1,
      GLOBAL: 10,
      DETECTOR: 30,
      DEFAULT_ROLE: 50,
      GUEST: 100
    });
  });

  it('should successfully compare strings with Role types', () => {
    assert.ok(isWithinRole('admin', Role.ADMIN));
    assert.ok(isWithinRole('ADMIN', Role.GUEST));
    assert.ok(isWithinRole('det-its', Role.GUEST));
    assert.ok(isWithinRole('det-tpc', Role.DETECTOR));
    assert.ok(isWithinRole('default-role', Role.DEFAULT_ROLE));
    assert.ok(!isWithinRole('guest', Role.DETECTOR));
    assert.ok(!isWithinRole('det-its', Role.ADMIN));
  });
});
