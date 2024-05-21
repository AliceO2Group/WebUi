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

import { ok } from 'assert';
import { getDateAsTimestamp } from './../../../../common/library/utils/dateTimeFormat.js';

/**
 * Test Suite for the common library of utils module for converting dates and times
 * @returns {undefined}
 */
export const commonLibraryUtilsDateTimeTestSuite = async () => {
  describe('getDateAsTimestamp - test suite', () => {
    it('should successfully return a number from a string timestamp', () => {
      const dateInMs = 1680263291130;
      ok(getDateAsTimestamp(`${dateInMs}`), dateInMs);
    });

    it('should successfully return a number from a string timestamp', () => {
      const dateInMs = 1680263291130;
      ok(getDateAsTimestamp(dateInMs), dateInMs);
    });

    it('should successfully return a number from a string date', () => {
      const dateStringInMs = '2023-03-31T11:49:33.048Z';
      ok(getDateAsTimestamp(dateStringInMs), 1680263373049);
    });

    it('should successfully return same value if it is a wrong one', () => {
      const notADateString = '2023-03-OL-definitely-not-date';
      ok(getDateAsTimestamp(notADateString), notADateString);
    });
  });
};
