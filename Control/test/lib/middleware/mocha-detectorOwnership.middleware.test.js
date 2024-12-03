const assert = require('assert');
const sinon = require('sinon');
const { User } = require('../../../lib/dtos/User');
const { detectorOwnershipMiddleware } = require('../../../lib/middleware/detectorOwnership.middleware');

const {Role} = require('../../lib/common/role.enum.js');
describe('`DetectorOwnerShipmiddleware` test suite', () => {
  let userStub;

  beforeEach(() => {
    userStub = sinon.stub(User.prototype, 'belongsToDetector');
  });

  afterEach(() => {
    userStub.restore();
  });

  it('should call next() if user has ownership of the detector', () => {
    const detectorId = 'det-its';
    const req = { params: { detectorId }, session: { personid: 0, name: 'testUser', access: ['det-its'] } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
    const next = sinon.stub();

    userStub.returns(true);

    detectorOwnershipMiddleware(req, res, next);

    assert.ok(next.calledOnce);
  });

  it('should return 403 if user does not have ownership of the detector', () => {
    const detectorId = 'det-its';
    const req = { params: { detectorId }, session: { personid: 0, name: 'testUser', access: [] } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
    const next = sinon.stub();

    userStub.returns(false);

    detectorOwnershipMiddleware(req, res, next);

    assert.ok(res.status.calledWith(403));
    assert.ok(res.
      json.calledWith({ message: `User testUser does not have ownership of the lock for detector ${detectorId}` }));
    assert.ok(next.notCalled);
  });


  it('should call belongsToDetector method of User', () => {
    const detectorId = 'det-its';
    const req = { params: { detectorId }, session: { personid: 0, name: 'testUser', access: ['det-its'] } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
    const next = sinon.stub();

    userStub.returns(true);

    detectorOwnershipMiddleware(req, res, next);

    assert.ok(userStub.calledOnceWith(detectorId));
  });

  it('should handle empty session object gracefully', () => {
    const detectorId = '1234';
    const req = { params: { detectorId }, session: {} }; // Empty session object
    const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
    const next = sinon.stub();

    detectorOwnershipMiddleware(req, res, next);

    assert.ok(res.status.calledWith(400));
    assert.ok(res.json.calledWith({ message: 'Invalid request: missing information' }));
    assert.ok(next.notCalled);
  });

  it('should call next() if user has a role higher than DETECTOR', () => {
    const detectorId = 'det-its';
    const req = { params: { detectorId }, session: { personid: 0, name: 'testUser', access: [Role.GLOBAL] } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
    const next = sinon.stub();

    detectorOwnershipMiddleware(req, res, next);

    assert.ok(next.calledOnce);
  });

});
