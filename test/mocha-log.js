const assert = require('assert');
const fs = require('fs');
const log = require('./../log/log.js');
const config = require('./../config.json');
const InfoLoggerSender = require('./../log/infologger-sender.js');
const InfoLoggerReceiver = require('./../log/infologger-receiver.js');

const configLocal = {
  winston: {
    file: './error.log',
    fileLvl: 'error',
    consoleLvl: 'debug'
  }
};

describe('InfoLogger and winston', () => {
  it('should generate error file (winston)', (done) => {
    log.configure(configLocal);
    log.error('Test error winston');
    setTimeout(() => {
      assert.ok(fs.existsSync('./error.log'));
      done();
    }, 100);
  });

  it('should fail on InfoLogger instance creation', (done) => {
    log.configure(config.log);
    setTimeout(() => {
      log.error('Test error InfoLogger');
      done();
    }, 100);
  });

  it('should prepare InfoLogger command', () => {
    const sender = new InfoLoggerSender('log');
    const log = {severity: 'E', message: 'test-log'};
    const expected = ['-oSeverity=E', '-oSystem=Web', '-oFacility=Node v8.3.0'];
    assert.deepStrictEqual(expected, sender.format(log));
  });

  it('should parse InfoLoger message', (done) => {
    const receiver = new InfoLoggerReceiver('log');
    const message = '*1.4#I##1505140368.399439#o2test#O2#143388#root#DAQ#P2##PHY##123###test\n';
    const expected = {
      severity: 'I',
      timestamp: '1505140368.399439',
      hostname: 'o2test',
      rolename: 'O2',
      pid: 143388,
      username: 'root',
      system: 'DAQ',
      facility: 'P2',
      partition: 'PHY',
      errcode: 123,
      message: 'test'
    };
    receiver.parse(message).then((parsed) => {
      assert.deepStrictEqual(parsed, expected);
      done();
    }, (error) => {
      assert.fail(error);
    });
  });
});
