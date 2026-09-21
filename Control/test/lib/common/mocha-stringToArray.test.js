/**
 * @license
 * Copyright 2019-2024 CERN and copyright holders of ALICE O2.
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

const assert = require('assert');
const {stringToArray} = require('../../../lib/common/stringToArray.js');

describe('stringToArray - test suite', () => {
  it('should successfully converts comma-separated string to array', () => {
    const input = 'a,b,c';
    const expectedOutput = ['a', 'b', 'c'];
    assert.deepStrictEqual(stringToArray(input), expectedOutput);
  });

    it('should successfully converts comma-separated string to array and trimmed values', () => {
    const input = 'a,   b, c';
    const expectedOutput = ['a', 'b', 'c'];
    assert.deepStrictEqual(stringToArray(input), expectedOutput);
  });

  it('should successfully return an input array as is', () => {
    const input = ['a', 'b', 'c'];
    const expectedOutput = ['a', 'b', 'c'];
    assert.deepStrictEqual(stringToArray(input), expectedOutput);
  });

  it('should successfully return an empty array for empty string', () => {
    const input = '';
    const expectedOutput = [];
    assert.deepStrictEqual(stringToArray(input), expectedOutput);
  });

  it('should successfully return empty array for empty array', () => {
    const input = [];
    const expectedOutput = [];
    assert.deepStrictEqual(stringToArray(input), expectedOutput);
  });
});
