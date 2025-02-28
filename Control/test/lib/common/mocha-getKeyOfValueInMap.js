/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

const { strictEqual } = require('assert');
const { getKeyOfValueInMap } = require('./../../../lib/common/getKeyOfValueInMap.js');

describe('getKeyOfValueInMap', () => {
  it('should return the key that contains the value', () => {
    const map = new Map([
      ['key1', ['value1', 'value2']],
      ['key2', ['value3', 'value4']],
    ]);

    const result = getKeyOfValueInMap(map, 'value3');
    strictEqual(result, 'key2');
  });

  it('should return null if the value is not found in the map', () => {
    const map = new Map([
      ['key1', ['value1', 'value2']],
      ['key2', ['value3', 'value4']],
    ]);

    const result = getKeyOfValueInMap(map, 'value5');
    strictEqual(result, null);
  });

  it('should handle an empty map', () => {
    const map = new Map();

    const result = getKeyOfValueInMap(map, 'value1');
    strictEqual(result, null);
  });

  it('should handle a map with empty arrays', () => {
    const map = new Map([
      ['key1', []],
      ['key2', []],
    ]);

    const result = getKeyOfValueInMap(map, 'value1');
    strictEqual(result, null);
  });
});
