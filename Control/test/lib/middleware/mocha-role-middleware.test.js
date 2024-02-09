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
const sinon = require('sinon');
const {minimumRoleMiddleware} = require('../../../lib/middleware/minimumRole.middleware');
const {Role} = require('../../../lib/common/role.enum');

describe('`Role Middleware` test suite', () => {
  it('should successfully call next() from Express with minimum role condition met', () => {
    const req = {session: {access: ['det-its']}};
    const next = sinon.stub().returns();
    minimumRoleMiddleware(Role.GUEST)(req, null, next);
    assert.ok(next.calledOnce);
  });

  it('should update HTTP response object with error of not authorized', () => {
    const req = {session: {access: ['det-its']}};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    minimumRoleMiddleware(Role.ADMIN)(req, res, null);
    assert.ok(res.status.calledWith(403));
    assert.ok(res.json.calledWith({message: 'Not enough permissions for this operation'}))
  });

  it('should update HTTP response object with general 500 status error if missing access', () => {
    const req = {};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    minimumRoleMiddleware(Role.ADMIN)(req, res, null);
    assert.ok(res.status.calledWith(500));
  });
});
