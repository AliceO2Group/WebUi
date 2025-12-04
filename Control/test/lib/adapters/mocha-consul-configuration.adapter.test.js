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
const sinon = require('sinon');

const QCConfigurationAdapter = require('../../../lib/adapters/QCConfigurationAdapter.js');
const { computeRestrictions, computeArrayRestrictions, deriveValueType } =
  QCConfigurationAdapter;

describe(`'QCConfigurationAdapter' test suite`, () => {
  describe('test computeRestrictions function', () => {
    it('should work for minimal input', () => {
      const configuration = {};
      const restrictions = {};

      assert.deepStrictEqual(computeRestrictions(configuration), restrictions);
    });

    it('should return restrictions for a big configuration', () => {
      const configuration = {
        key1: 'value1',
        key2: '10',
        key3: [{ key1: 'string' }, { key1: 'true' }],
        key4: 'false',
        key5: { key1: 'nested', key2: 'false' },
      };
      const restrictions = {
        key1: 'string',
        key2: 'number',
        key3: [[{ key1: 'string' }, { key1: 'boolean' }], {}],
        key4: 'boolean',
        key5: { key1: 'string', key2: 'boolean' },
      };

      assert.deepStrictEqual(computeRestrictions(configuration), restrictions);
    });

    it('should not throw for bad input', () => {
      assert.deepStrictEqual(computeRestrictions(), {});
      assert.deepStrictEqual(computeRestrictions(undefined), {});
      assert.deepStrictEqual(computeRestrictions(null), {});
      assert.deepStrictEqual(computeRestrictions(0), {});
      assert.deepStrictEqual(computeRestrictions(''), {});
      assert.deepStrictEqual(
        computeRestrictions([{ wrong: 'array input' }]),
        {}
      );
    });
  });

  describe('test deriveValueType function', () => {
    it('should handle string arguments properly', () => {
      assert.equal(deriveValueType('test'), 'string');
      assert.equal(deriveValueType(''), 'string');
      assert.equal(deriveValueType('   '), 'string');
      assert.equal(deriveValueType('{}'), 'string');
      assert.equal(deriveValueType('{ thisIs: stringStill }'), 'string');
      assert.equal(deriveValueType('[]'), 'string');
      assert.equal(deriveValueType('[test, 10]'), 'string');
    });

    it('should handle boolean arguments properly', () => {
      assert.equal(deriveValueType(true), 'boolean');
      assert.equal(deriveValueType(false), 'boolean');
      assert.equal(deriveValueType('true'), 'boolean');
      assert.equal(deriveValueType('false'), 'boolean');
      assert.equal(deriveValueType('True'), 'boolean');
      assert.equal(deriveValueType('fALse'), 'boolean');
    });

    it('should handle numeric arguments properly', () => {
      assert.equal(deriveValueType(0), 'number');
      assert.equal(deriveValueType(1), 'number');
      assert.equal(deriveValueType(-3), 'number');
      assert.equal(deriveValueType('15'), 'number');
      assert.equal(deriveValueType('1e-3'), 'number');
      assert.equal(deriveValueType('0.3'), 'number');

      it('should handle object arguments properly', () => {
        const computeRestrictionsSpy = sinon.spy(
          QCConfigurationAdapter,
          'computeRestrictions'
        );
        // for object arguments, the computeRestrictions function should be called
        deriveValueType(0);
        assert.equal(computeRestrictionsSpy.calledOnce, false);
        deriveValueType({});
        assert.equal(computeRestrictionsSpy.calledOnce, true);
        QCConfigurationAdapter.computeRestrictions.restore();
      });
    });

    it('should handle array arguments properly', () => {
      const computeArrayRestrictionsSpy = sinon.spy(
        QCConfigurationAdapter,
        'computeArrayRestrictions'
      );
      // for array arguments, the computeArrayRestrictions function should be called
      deriveValueType(0);
      assert.equal(computeArrayRestrictionsSpy.calledOnce, false);
      deriveValueType([]);
      assert.equal(computeArrayRestrictionsSpy.calledOnce, true);
      QCConfigurationAdapter.computeArrayRestrictions.restore();
    });
  });
  describe('test computeArrayRestrictions function', () => {
    it('should return base case for empty array', () => {
      assert.deepStrictEqual(computeArrayRestrictions([]), [[], {}]);
    });

    it('should return type of every object in an array and a proper intersection', () => {
      const inputArray = [
        { type: 'flp', active: true, id: 0 },
        { type: 'ctp', active: 'inactive', id: '1' },
        { type: 'list', id: '-1e+3', list: ['text', 99, true] },
      ];

      const  expectedRestrictions = [
        [
          { type: 'string', active: 'boolean', id: 'number' },
          { type: 'string', active: 'string', id: 'number' },
          { type: 'string', id: 'number', list: [['string', 'number', 'boolean'], {}] }
        ],
        { type: 'string', id: 'number' },
      ];

      assert.deepStrictEqual(computeArrayRestrictions(inputArray), expectedRestrictions);
    });

    it('should ignore primitives when finding an intersection of types included in the array', () => {
      const expectedRestrictions = [[{ type: 'string'}, 'string'], { type: 'string'}];
      assert.deepStrictEqual(computeArrayRestrictions([0, false, 'text']), [['number', 'boolean', 'string'], {}]);
      assert.deepStrictEqual(computeArrayRestrictions([{ type: 'flp'}, 'text']), expectedRestrictions);
    });

    it('should intersect blueprints of directly nested arrays', () => {
      const firstArray = [{ name: 'flp', active: 'yes' }];
      const firstArrayRestrictions = [[{ name: 'string', active: 'string' }], { name: 'string', active: 'string'}];
      const secondArray = [{ name: 'also-flp', active: true }];
      const secondArrayRestrictions = [[{ name: 'string', active: 'boolean' }], { name: 'string', active: 'boolean'}];
      const expectedRestrictions = [[firstArrayRestrictions, secondArrayRestrictions], { name: 'string' }];
      assert.deepStrictEqual(computeArrayRestrictions([firstArray, secondArray]), expectedRestrictions);
    });
  });
});
