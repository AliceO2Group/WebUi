const assert = require('assert');
const fs = require('fs');
const log = require('./../log/log.js');
const config = require('./../config.json');

const configLocal = {
  winston: {
    file: './error.log',
    fileLvl: 'error',
    consoleLvl: 'debug'
  }
};

describe('error-log', () => {
  it('should generate error file', (done) => {
    log.configure(configLocal);
    log.error('Test error log entry');
    setTimeout(() => {
      assert.ok(fs.existsSync('./error.log'));
      done();
    }, 100);
  });

  it('should generate error file', (done) => {
    log.configure(config.log);
    setTimeout(() => {
      log.error('test');
      done();
    }, 400);
  });
  after(() => {
    log.stop();
  });
});
