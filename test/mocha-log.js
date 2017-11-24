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

describe('should display and write log to a file (winston)', () => {
  it('should generate error file', (done) => {
    log.configure(configLocal);
    log.error('Test error winston');
    setTimeout(() => {
      assert.ok(fs.existsSync('./error.log'));
      done();
    }, 100);
  });

  it('should pass log message to InfoLogger client', (done) => {
    log.configure(config.log);
    setTimeout(() => {
      log.error('Test error InfoLogger');
      done();
    }, 500);
  });
});
