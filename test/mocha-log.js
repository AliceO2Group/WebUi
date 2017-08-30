const assert = require('assert');
const fs = require('fs');
const log = require('./../log.js');

describe('error-log', () => {
  it('should generate error file', () => {
    log.error('Test error log entry');
    setTimeout(() => {
      assert.ok(fs.existsSync('./error.log'));
    }, 1000);
  });
});
