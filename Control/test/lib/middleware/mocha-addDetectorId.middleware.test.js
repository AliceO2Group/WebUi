const assert = require('assert');
const sinon = require('sinon');

// Import the middleware
const { addDetectorIdMiddleware } = require('../../../lib/middleware/addDetectorId.middleware');

describe('`addDetectorIdMiddleware` test suite', () => {
  it('should add the specified detectorId to req.params and call next()', () => {
    const detectorId = '1234';
    const req = { params: {} }; // Mock req object
    const res = {}; // Mock res object
    const next = sinon.stub(); // Mock next function

    addDetectorIdMiddleware(detectorId)(req, res, next);

    // Validate the detectorId is added
    assert.strictEqual(req.params.detectorId, detectorId);
    // Ensure next() is called
    assert.ok(next.calledOnce);
  });

  it('should overwrite existing detectorId in req.params', () => {
    const detectorId = '5678';
    const req = { params: { detectorId: 'original' } };
    const res = {};
    const next = sinon.stub();

    addDetectorIdMiddleware(detectorId)(req, res, next);

    // Validate the detectorId is overwritten
    assert.strictEqual(req.params.detectorId, detectorId);
    assert.ok(next.calledOnce);
  });

});
