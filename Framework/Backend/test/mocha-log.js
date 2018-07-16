const assert = require('assert');
const fs = require('fs');
const log = require('./../log/log.js');
const config = require('./../config-default.json');
const process = require('process');
const {InfoLoggerSender, InfoLoggerReceiver} = require('./../log/log.js');

const configLocal = {
  winston: {
    file: './error.log',
    fileLvl: 'error',
    consoleLvl: 'debug'
  }
};

describe('Logging: winston', () => {
  it('Generate error file (winston)', (done) => {
    log.configure(configLocal);
    log.error('Test error winston');
    setTimeout(() => {
      assert.ok(fs.existsSync('./error.log'));
      done();
    }, 100);
  });
});

describe('Logging: InfoLogger', () => {
  it('Fail on instance creation', (done) => {
    log.configure(config.log);
    setTimeout(() => {
      log.error('Test error InfoLogger');
      done();
    }, 100);
  });

  it('Prepare bash command', () => {
    const sender = new InfoLoggerSender('log');
    const log = {severity: 'E', message: 'test-log'};
    const expected = ['-oSeverity=E', '-oSystem=Web', `-oFacility=Node ${process.version}`];
    assert.deepStrictEqual(expected, sender.format(log));
  });

  it('Parse message 1.4 with empty fields', () => {
    const receiver = new InfoLoggerReceiver();
    const message = '*1.4#I##1505140368.399439#o2test#O2#143388#root#DAQ#P2##PHY##123###test\n';
    const expected = {
      severity: 'I',
      timestamp: 1505140368.399439,
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
    const parsed = receiver.parse(message);
    assert.deepStrictEqual(parsed, expected);
  });

  it('Parse message 1.3', () => {
    const receiver = new InfoLoggerReceiver();
    const message = '*1.3#I##1505140368.399439#o2test#O2#143388#root#DAQ#P2#Alice#PHY#dest##123#8#source.cpp#test\n';
    const expected = {
      severity: 'I',
      timestamp: 1505140368.399439,
      hostname: 'o2test',
      rolename: 'O2',
      pid: 143388,
      username: 'root',
      system: 'DAQ',
      facility: 'P2',
      detector: 'Alice',
      partition: 'PHY',
      dest: 'dest',
      errcode: 123,
      errline: 8,
      errsource: 'source.cpp',
      message: 'test'
    };
    const parsed = receiver.parse(message);
    assert.deepStrictEqual(parsed, expected);
  });
});
