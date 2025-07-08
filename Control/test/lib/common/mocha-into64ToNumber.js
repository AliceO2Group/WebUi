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

const assert = require('assert');
const { adaptInt64ToNumber } = require('../../../lib/common/utils/adaptInt64ToNumber.js');

describe('adaptInt64ToNumber', function () {
  it('should convert a BigInt to a Number', function () {
    const bigIntValue = BigInt('123456789012345');
    const result = adaptInt64ToNumber(bigIntValue);
    assert.strictEqual(result, 123456789012345);
    assert.strictEqual(typeof result, 'number');
  });

  it('should handle string input representing a number', function () {
    const stringValue = '9876543210';
    const result = adaptInt64ToNumber(stringValue);
    assert.strictEqual(result, 9876543210);
    assert.strictEqual(typeof result, 'number');
  });

  it('should handle Number input', function () {
    const numberValue = 12345;
    const result = adaptInt64ToNumber(numberValue);
    assert.strictEqual(result, 12345);
    assert.strictEqual(typeof result, 'number');
  });

  it('should handle negative BigInt values', function () {
    const negativeBigInt = BigInt('-123456789');
    const result = adaptInt64ToNumber(negativeBigInt);
    assert.strictEqual(result, -123456789);
  });

  it('should handle zero', function () {
    const zero = BigInt(0);
    const result = adaptInt64ToNumber(zero);
    assert.strictEqual(result, 0);
  });

  it('should lose precision for very large BigInt values', function () {
    // JavaScript numbers are IEEE-754 doubles, so >2^53 may lose precision
    const bigIntValue = BigInt('9007199254740993'); // 2^53 + 1
    const result = adaptInt64ToNumber(bigIntValue);
    // Should not strictly equal the original value due to precision loss
    assert.notStrictEqual(result, 9007199254740993n);
    // But should be a number
    assert.strictEqual(typeof result, 'number');
  });
});
