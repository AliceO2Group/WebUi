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

const { strictEqual, deepStrictEqual } = require('assert');
const InfoLoggerMessage = require('../../log/InfoLoggerMessage.js');

describe('Logging: InfoLoggerMessage', () => {
  describe('_removeNewLinesAndTabs: ', () => {
    it('should successfully parse Error into one line string message', () => {
      strictEqual(
        InfoLoggerMessage._removeNewLinesAndTabs(new Error('Error in Error')),
        'Error: Error in Error',
        'Parsed message from Error is incorrect',
      );
    });

    it('should successfully parse Object into one line string message', () => {
      /**
       * Test class for parsing
       */
      class T {
        /**
         * Constructor for T class
         */
        constructor() {
          this.message = 'Test Class Parse';
        }
      }
      strictEqual(
        InfoLoggerMessage._removeNewLinesAndTabs(new T()),
        '{"message":"Test Class Parse"}',
        'Parsed message from class T is incorrect',
      );
      strictEqual(
        InfoLoggerMessage._removeNewLinesAndTabs({ error: 'Error in JSON' }),
        '{"error":"Error in JSON"}',
        'Parsed message from JSON is incorrect',
      );
    });

    it('should successfully parse multi-line string into one line string message', () => {
      const multiLineString = 'SomeError\nHappenedHere\nAnd\nthere\tplus\tsomeother';
      strictEqual(
        InfoLoggerMessage._removeNewLinesAndTabs(multiLineString),
        'SomeError HappenedHere And there plus someother',
      );
    });

    it('should successfully return empty string if log is undefined or null', () => {
      strictEqual(InfoLoggerMessage._removeNewLinesAndTabs(''), '', '1');
      strictEqual(InfoLoggerMessage._removeNewLinesAndTabs(undefined), '', '2');
      strictEqual(InfoLoggerMessage._removeNewLinesAndTabs(null), '', '3');
      strictEqual(InfoLoggerMessage._removeNewLinesAndTabs(), '', '4');
    });
  });

  describe('getComponentsOfMessage: ', () => {
    it('should successfully return default values for empty log message', () => {
      const log = new InfoLoggerMessage();
      const expectedComponents = ['-oSeverity=Info', '-oLevel=11', '-oSystem=GUI', '-oFacility=gui', ''];
      deepStrictEqual(log.getComponentsOfMessage(), expectedComponents);
    });

    it('should successfully return correct values for log message from JSON', () => {
      const log = InfoLoggerMessage.fromObject({
        severity: 'Error',
        system: 'tests',
        run: 12345,
        message: 'TestWithJSON',
      });
      const expectedComponents = ['-oSeverity=Error', '-oLevel=11', '-oSystem=tests', '-oFacility=gui', '-oRun=12345', 'TestWithJSON'];

      deepStrictEqual(log.getComponentsOfMessage(), expectedComponents);
    });
  });
});
