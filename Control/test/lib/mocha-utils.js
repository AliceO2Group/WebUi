const sinon = require('sinon');
const assert = require('assert');
const errorHandler = require('./../../lib/utils.js').errorHandler;

describe('Check errors are handled and sent successfully', () => {
  let res;

  beforeEach(() => {
    res = {
      status: sinon.fake.returns(),
      send: sinon.fake.returns(true)
    };
  });

  it('should successfully respond with built error message when there is a message and no status', () => {
    errorHandler('Error', res);
    assert.ok(res.status.calledOnce);
  });

  it('should successfully respond with built error message and status > 500', () => {
    errorHandler('Error', res, 502);
    assert.ok(res.status.calledWith(502));
  });

  it('should successfully respond with built error message and status < 500', () => {
    errorHandler('Error', res, 404);
    assert.ok(res.status.calledWith(404));
  });


  it('should successfully respond with built error.message and status', () => {
    const err = {
      message: 'Test Error',
      stack: 'Some Stack'
    };
    errorHandler(err, res, 502);
    assert.ok(res.status.calledWith(502));
    assert.ok(res.send.calledWith({message: 'Test Error'}));
  });

  it('should successfully respond with built error.message, no stack and status', () => {
    const err = 'Test Error';
    errorHandler(err, res, 404);
    assert.ok(res.status.calledWith(404));
    assert.ok(res.send.calledWith({message: 'Test Error'}));
  });
});
