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

/* eslint-disable max-len */
/* eslint-disable require-jsdoc */

const assert = require('assert');
const fs = require('fs');
const Log = require('./../log/Log.js');
const config = require('./../config-default.json');
const InfoLoggerReceiver = require('./../log/InfoLoggerReceiver.js');
const InfoLoggerSender = require('./../log/InfoLoggerSender.js');
const Winston = require('./../log/winston.js');

const skip = true;

describe('Logging: winston', () => {
  it('Generate error file (winston)', (done) => {
    const winstonConf = {winston: config.log.winston};
    Log.configure(winstonConf);
    const logger = new Log('test-winston');
    logger.error('Test error winston');
    setTimeout(() => {
      assert.ok(fs.existsSync('./error.log'));
      done();
    }, 100);
  });
});

describe('Logging: InfoLogger sender', () => {
  let sender;
  before(() => {
    const winston = new Winston();
    sender = new InfoLoggerSender(winston, config.log.infologger.sender);
  })
  it('Send log over named socket', function() {
    if (skip) {
      this.skip(); // eslint-disable-line no-invalid-this
    }
    sender.send({severity: 'D', message: 'test', rolename: 'il-sender-test'});
    sender.close()
  });

  it('should succesfully parse Error into one line string message', () => {
    assert.strictEqual(sender._removeNewLinesAndTabs(new Error('Error in Error')), 'Error: Error in Error', 'Parsed message from Error is incorrect');
  });

  it('should succesfully parse Object into one line string message', () => {
    class T {constructor() {this.message = 'Test Class Parse';} }
    assert.strictEqual(sender._removeNewLinesAndTabs(new T()), '{"message":"Test Class Parse"}', 'Parsed message from class T is incorrect');
    assert.strictEqual(sender._removeNewLinesAndTabs({error: 'Error in JSON'}), '{"error":"Error in JSON"}', 'Parsed message from JSON is incorrect');
  });

  it('should succesfully parse multi-line string into one line string message', () => {
    const multiLineString = 'SomeError\nHappenedHere\nAnd\nthere\tplus\tsomeother';
    assert.strictEqual(sender._removeNewLinesAndTabs(multiLineString), 'SomeError HappenedHere And there plus someother');
  });

  it('should succesfully return empty string if log is undefined or null', () => {
    assert.strictEqual(sender._removeNewLinesAndTabs(''), '', '1');
    assert.strictEqual(sender._removeNewLinesAndTabs(undefined), '', '2');
    assert.strictEqual(sender._removeNewLinesAndTabs(null), '', '3');
    assert.strictEqual(sender._removeNewLinesAndTabs(), '', '4');
  });
});

describe('Logging: InfoLogger protocol', () => {
  it('Parse protocol 1.4 with empty fields', () => {
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


  it('Parse protocol 1.3', (done) => {
    const receiver = new InfoLoggerReceiver();
    // eslint-disable-next-line max-len
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
    receiver.on('message', (parsed) => {
      assert.deepStrictEqual(parsed, expected);
      done();
    });
    receiver.onData(message);
  });

  it('Parse multiple 1.3 logs', (done) => {
    const receiver = new InfoLoggerReceiver();
    let counter = 0;
    receiver.on('message', (parsed) => {
      counter++;
      assert.strictEqual(parsed.facility, 'pauseAndResetRun');
      assert.strictEqual(parsed.partition, 'PHYSICS_1');
      assert.strictEqual(parsed.run, 289724);
      if (counter === 3) {
        done();
      }
    });
    const messages =
      /* eslint-disable max-len */
      `*1.3#I#6#1531982951.042664#aldaqpc031#ldc-TRD-5#37971#alicedaq#DAQ#pauseAndResetRun#TRD#PHYSICS_1##289724##91#pauseAndResetRun.c#POST_PAR completed
*1.3#I#6#1531982951.033947#aldaqpc029#ldc-TRD-3#38035#alicedaq#DAQ#pauseAndResetRun#TRD#PHYSICS_1##289724##91#pauseAndResetRun.c#POST_PAR completed
*1.3#I#6#1531982951.482111#aldaqpc134#ldc-TPC-C-15#45919#alicedaq#DAQ#pauseAndResetRun#TPC#PHYSICS_1##289724##91#pauseAndResetRun.c#POST_PAR completed
*1.3#I#6#1531982951.169333#aldaqpc119#ldc-TPC-C-0#7780#alicedaq#DAQ#pauseAndResetRun#TPC#PHYSICS_1##289724##91#pauseAndResetRun.c#POST_PAR completed`;
    receiver.onData(messages);
    /* eslint-enable max-len */
  });

  it('Parse chopped log', (done) => {
    const receiver = new InfoLoggerReceiver();
    const message = '*1.3#I##1505140368.399439#o2test#O2#143388#ro';
    const message2 = 'ot#DAQ#P2#Alice#PHY#dest##123#8#source.cpp#test\n';
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
    let count = 0;
    receiver.on('message', (parsed) => {
      assert.deepStrictEqual(parsed, expected);
      count++;
      if (count === 2) {
        done();
      }
    });
    receiver.onData(message);
    receiver.onData(message2);
    receiver.onData(message);
    receiver.onData(message2);
  });

  it('Parse multiple logs, last one chopped', (done) => {
    const receiver = new InfoLoggerReceiver();
    let counter = 0;
    receiver.on('message', (parsed) => {
      counter++;
      assert.strictEqual(parsed.facility, 'pauseAndResetRun');
      assert.strictEqual(parsed.partition, 'PHYSICS_1');
      assert.strictEqual(parsed.run, 289724);
      if (counter === 3) {
        done();
      }
    });
    const messages =
      /* eslint-disable max-len */
      `*1.3#I#6#1531982951.042664#aldaqpc031#ldc-TRD-5#37971#alicedaq#DAQ#pauseAndResetRun#TRD#PHYSICS_1##289724##91#pauseAndResetRun.c#POST_PAR completed
*1.3#I#6#1531982951.033947#aldaqpc029#ldc-TRD-3#38035#alicedaq#DAQ#pauseAndResetRun#TRD#PHYSICS_1##289724##91#pauseAndResetRun.c#POST_PAR completed
*1.3#I#6#1531982951.482111#aldaqpc134#ldc-TPC-C-15#45919#alicedaq#DAQ#pauseAndResetRun#TPC#PHYSICS_1##289724##91#pauseAndResetRun.c#POST_PAR completed
*1.3#I#6#1531982951.169333#aldaqpc119#ldc-TPC-C-0#7780#alice`;
    const messages2 = 'daq#DAQ#pauseAndResetRun#TPC#PHYSICS_1##289724##91#pauseAndResetRun.c#POST_PAR completed\n';
    receiver.onData(messages);
    receiver.onData(messages2);
    /* eslint-enable max-len */
  });
});
