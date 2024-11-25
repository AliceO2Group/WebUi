const assert = require('assert');
const sinon = require('sinon');
const express = require('express');
const request = require('supertest');

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

  it('should integrate with an Express route and add detectorId', async () => {
    const app = express();

    // Use the middleware with a specific detectorId
    app.get(
      '/:id',
      addDetectorIdMiddleware('testDetector'),
      (req, res) => {
        res.json(req.params);
      }
    );

    // Test the route with Supertest
    const response = await request(app).get('/456');
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, {
      id: '456', // Route parameter
      detectorId: 'testDetector', // Added by middleware
    });
  });
});
