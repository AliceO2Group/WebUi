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
const { LogManager } = require('@aliceo2/web-ui');
const {
  computeObjectRestrictions,
  computeArrayRestrictions,
  deriveValueType,
  getRestrictionsIntersection,
  getArrayRestrictionsIntersection,
  getObjectRestrictionsIntersection,
  isPrimitive,
  isObject,
  bothArePrimitive,
  arrayIntersectionCondition,
  objectIntersectionCondition,
} = QCConfigurationAdapter;

describe(`'QCConfigurationAdapter' test suite`, () => {
  describe('test computeObjectRestrictions function', () => {
    it('should work for minimal input', () => {
      const configuration = {};
      const restrictions = {};

      assert.deepStrictEqual(computeObjectRestrictions(configuration), restrictions);
    });

    it('should handle inconsistent types for the same key across objects', () => {
      const configuration = {
        key1: 10,
        key2: { value: "text" },
        key3: { value: true },
      };

      const expected = {
        key1: 'number',
        key2: { value: 'string' },
        key3: { value: 'boolean' },
      };

      assert.deepStrictEqual(computeObjectRestrictions(configuration), expected);
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
        key3: [[{ key1: 'string' }, { key1: 'boolean' }], {}, null],
        key4: 'boolean',
        key5: { key1: 'string', key2: 'boolean' },
      };

      assert.deepStrictEqual(computeObjectRestrictions(configuration), restrictions);
    });

    it('should not throw for bad input', () => {
      assert.deepStrictEqual(computeObjectRestrictions(), {});
      assert.deepStrictEqual(computeObjectRestrictions(undefined), {});
      assert.deepStrictEqual(computeObjectRestrictions(null), {});
      assert.deepStrictEqual(computeObjectRestrictions(0), {});
      assert.deepStrictEqual(computeObjectRestrictions(''), {});
      assert.deepStrictEqual(
        computeObjectRestrictions([{ wrong: 'array input' }]),
        {}
      );
    });
  });

  describe('test deriveValueType function', () => {
    it('should not throw for bad input', () => {
      const logCreator = sinon.spy(LogManager, 'getLogger');

      assert.equal(deriveValueType(null), 'unknown');
      assert.equal(deriveValueType(undefined), 'unknown');
      assert.equal(logCreator.calledTwice, true);

      logCreator.restore();
    });

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
    });

    it('should not treat malformed numbers as numeric', () => {
      assert.equal(deriveValueType("1.2.3"), "string");
      assert.equal(deriveValueType("ten"), "string");
      assert.equal(deriveValueType("true-ish"), "string");
    });

    it('should handle object arguments properly', () => {
      const computeObjectRestrictionsSpy = sinon.spy(
        QCConfigurationAdapter,
        'computeObjectRestrictions'
      );
      // for object arguments, the computeObjectRestrictions function should be called
      deriveValueType(0);
      assert.equal(computeObjectRestrictionsSpy.notCalled, true);
      deriveValueType({});
      assert.equal(computeObjectRestrictionsSpy.calledOnce, true);
      computeObjectRestrictionsSpy.restore();
    });

    it('should handle array arguments properly', () => {
      const computeArrayRestrictionsSpy = sinon.spy(
        QCConfigurationAdapter,
        'computeArrayRestrictions'
      );
      // for array arguments, the computeArrayRestrictions function should be called
      deriveValueType(0);
      assert.equal(computeArrayRestrictionsSpy.notCalled, true);
      deriveValueType([]);
      assert.equal(computeArrayRestrictionsSpy.calledOnce, true);
      computeArrayRestrictionsSpy.restore();
    });
  });

  describe('test computeArrayRestrictions function', () => {
    it('should return base case for empty array', () => {
      assert.deepStrictEqual(computeArrayRestrictions([]), [[], null, null]);
    });

    it('should ignore primitives when finding an intersection of types included in the array', () => {
      const inputArray1 = ['0', false, 'text'];
      const expectedRestrictions1 = [['number', 'boolean', 'string'], null, null];

      const inputArray2 = [{ type: 'flp'}, 'text'];
      const expectedRestrictions2 = [[{ type: 'string'}, 'string'], { type: 'string'}, null];

      assert.deepStrictEqual(computeArrayRestrictions(inputArray1), expectedRestrictions1);
      assert.deepStrictEqual(computeArrayRestrictions(inputArray2), expectedRestrictions2);
    });

    it('should generate identical restrictions for arrays with same content in different order', () => {
      const item1 = { name: 'flp' };
      const item2 = { name: 'ctp' };

      assert.deepStrictEqual(
        computeArrayRestrictions([item1, item2]),
        computeArrayRestrictions([item2, item1]),
      );
    });

    it('should drop keys from blueprint intersection when missing in any object', () => {
      const arr = [{ name: "flp", type: "flp-Mx-03" }, { name: "ctp" }];

      const expected = [
        [{ name: "string", type: "string" }, { name: "string" }],
        { name: "string" },
        null
      ];

      assert.deepStrictEqual(computeArrayRestrictions(arr), expected);
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
          { type: 'string', id: 'number', list: [['string', 'number', 'boolean'], null, null] }
        ],
        { type: 'string', id: 'number' },
        null
      ];

      assert.deepStrictEqual(computeArrayRestrictions(inputArray), expectedRestrictions);
    });

    it('should properly intersect the blueprint value for nested arrays', () => {
      const inputArray = [
        { type: 'flp', active: false },
        'ignored-for-type-and-array-intersection',
        { type: 'ctp' , active: 'no' },
        [{ id: 0, active: true }, 'also-ignored'],
        [{ id: 0, active: 'yes' }]
      ];

      const expectedRestrictions = [
        [
          { type: 'string', active: 'boolean'},
          'string',
          { type: 'string', active: 'string'},
          [[{ id: 'number', active: 'boolean' }, 'string'], { id: 'number', active: 'boolean' }, null],
          [[{ id: 'number', active: 'string' }], { id: 'number', active: 'string' }, null],
        ],
        { type: 'string' },
        [[], { id: 'number' }, null],
      ];

      assert.deepStrictEqual(computeArrayRestrictions(inputArray), expectedRestrictions);
    });

    it('should properly intersect blueprints of directly nested arrays', () => {
      const firstArray = [{ name: 'flp', active: 'yes' }];
      const firstArrayRestrictions = [
        [{ name: 'string', active: 'string' }],
        { name: 'string', active: 'string'},
        null, // null because firstArray does not contain directly nested arrays
      ];

      const secondArray = [{ name: 'also-flp', active: true }];
      const secondArrayRestrictions = [
        [{ name: 'string', active: 'boolean' }],
        { name: 'string', active: 'boolean'},
        null, // null because secondArray does not contain directly nested arrays
      ];

      const bigArray = [firstArray, secondArray];
      const bigArrayRestrictions = [
        [firstArrayRestrictions, secondArrayRestrictions],
        null, // null because bigArray does not contain any objects directly
        [[], { name: 'string' }, null],
      ];
      assert.deepStrictEqual(computeArrayRestrictions(bigArray), bigArrayRestrictions);
    });

    it('should properly intersect blueprints and drop excessive data', () => {
      const innerArray1 = [{ one: 1, two: 2, three: 3 }];
      const innerArray1Restrictions = [
        [{ one: 'number', two: 'number', three: 'number' }], // content Restrictions
        { one: 'number', two: 'number', three: 'number' }, // blueprint for a new object created
        null // would be a blueprint for a new array created, null because array does not contain other arrays
      ];

      const innerArray2 = [{ one: 1, three: 3 }];
      const innerArray2Restrictions = [
        [{ one: 'number', three: 'number' }],
        { one: 'number', three: 'number' },
        null // null because array does not contain other arrays which are directly nested
      ];

      const innerArray3 = [{ one: 1, two: 3 }];
      const innerArray3Restrictions = [
        [{ one: 'number', two: 'number' }],
        { one: 'number', two: 'number' },
        null // null because array does not contain other arrays which are directly nested
      ];

      const firstArray = [innerArray1, innerArray2];
      const firstArrayRestrictions = [
        [innerArray1Restrictions, innerArray2Restrictions],
        null, // null because firstArray does not contain any objects
        [[], { one: 'number', three: 'number' }, null]
      ];

      const secondArray = ['text', { key: true }, innerArray3];
      const secondArrayRestrictions = [
        ['string', { key: 'boolean' }, innerArray3Restrictions],
        { key: 'boolean' },
        [[], innerArray3Restrictions[1], innerArray3Restrictions[2]]
        // we drop the list of object restrictions above because the new array is not filled with objects yet
        // this is excessive data we do not want in the result
      ];

      const bigArray = [firstArray, secondArray];
      const bigArrayRestrictions = [
        [firstArrayRestrictions, secondArrayRestrictions],
        null, // null because array does not contain any objects
        [[], { key: 'boolean' }, [[], { one: 'number' }, innerArray3Restrictions[2]]] // this inner array blueprint contains
        // recursive definition for inner arrays because there is a two-level-deep nested array
      ];

      assert.deepStrictEqual(computeArrayRestrictions(innerArray1), innerArray1Restrictions);
      assert.deepStrictEqual(computeArrayRestrictions(innerArray2), innerArray2Restrictions);
      assert.deepStrictEqual(computeArrayRestrictions(innerArray3), innerArray3Restrictions);
      assert.deepStrictEqual(computeArrayRestrictions(firstArray), firstArrayRestrictions);
      assert.deepStrictEqual(computeArrayRestrictions(secondArray), secondArrayRestrictions);
      assert.deepStrictEqual(computeArrayRestrictions(bigArray), bigArrayRestrictions);
    });
  });

  describe('test getRestrictionsIntersection', () => {
    it('should not fail for bad input', () => {
      assert.equal(getRestrictionsIntersection('text', 'another'), null);
      assert.equal(getRestrictionsIntersection('text', 3), null);
      assert.equal(getRestrictionsIntersection(false, 'another'), null);
      assert.equal(getRestrictionsIntersection(2, true), null);
      assert.equal(getRestrictionsIntersection(['text'], 'another'), null);
      assert.equal(getRestrictionsIntersection('text', []), null);
      assert.equal(getRestrictionsIntersection({}, 'another'), null);
      assert.equal(getRestrictionsIntersection('text', { shouldFail: true }), null);
      assert.equal(getRestrictionsIntersection(['text', 'another'], { shouldFail: true }), null);
    });

    it('should find the proper intersection', () => {
      const first = { test: 'string', id: 'number', active: 'boolean' };
      const second = { test: 'string', id: 'number', list: [[{ key: 'string' }], { key: 'string' }, null] };
      const third = { active: 'boolean', list: [[{ key: 'string' }], { key: 'string' }, null] };

      assert.deepStrictEqual(getRestrictionsIntersection(first, second), { test: 'string', id: 'number' });
      assert.deepStrictEqual(getRestrictionsIntersection(first, third), { active: 'boolean' });
      assert.deepStrictEqual(getRestrictionsIntersection(second, third), { list: [[], { key: 'string' }, null] });
      assert.deepStrictEqual(getRestrictionsIntersection(getRestrictionsIntersection(first, second), third), {});
    });

    it('should intersect nested arrays correctly', () => {
      const first = { list: [[{ id: "number" }], { id: "number" }, null] };

      const second = {
        list: [[{ id: "number", active: "boolean" }], { id: "number", active: "boolean" }, null]
      };

      const expected = { list: [[], { id: "number" }, null] };
      
      assert.deepStrictEqual(getRestrictionsIntersection(first, second), expected);
    });

    it('should return empty object when no keys intersect', () => {
      const first = { nested: { name: "string" } };
      const second = { nested: { id: "number" } };

      assert.deepStrictEqual(getRestrictionsIntersection(first, second), { nested: {} });
    });

  });

  describe('test getArrayRestrictionsIntersection', () => {
    it('should not fail for bad input', () => {
      assert.equal(getArrayRestrictionsIntersection(null, null), null);
    });

    it('should respect any ArrayRestrictions if the second one is null', () => {
      const verySpecificArrayRestrictions = [
        [
          { rareKey: 'string', specificName: 'boolean', nestedArray: [['boolean'], null, null] },
          [['boolean', { key: 'value' }, []], { key: 'value' }, [[], null, null]],
        ],
        { rareKey: 'string', specificName: 'boolean', nestedArray: [['boolean'], null, null] },
        [[], { key: 'value' }, ['boolean', { key: 'value' }, [[], null, null]]],
      ];

      assert.deepStrictEqual(
        getArrayRestrictionsIntersection(verySpecificArrayRestrictions, null),
        [[], verySpecificArrayRestrictions[1], verySpecificArrayRestrictions[2]],
      );

      assert.deepStrictEqual(
        getArrayRestrictionsIntersection(null, verySpecificArrayRestrictions),
        [[], verySpecificArrayRestrictions[1], verySpecificArrayRestrictions[2]],
      );
    });
  });

  describe('test getObjectRestrictionsIntersection', () => {
    it('should not fail for bad input', () => {
      assert.equal(getObjectRestrictionsIntersection(null, null), null);
    });

    it('should respect any ArrayRestrictions if the second one is null', () => {
      const verySpecificObjectRestrictions = {
        name: 'string',
        id: 'number',
        active: 'boolean',
        dbCredentials: { url: 'string', username: 'string', port: 'number' },
        list: [
          [
            { rareKey: 'string', specificName: 'boolean', nestedArray: [['boolean'], null, null] },
            [['boolean', { key: 'value' }, []], { key: 'value' }, [[], null, null]],
          ],
          { rareKey: 'string', specificName: 'boolean', nestedArray: [['boolean'], null, null] },
          [[], { key: 'value' }, ['boolean', { key: 'value' }, [[], null, null]]],
        ],
      };

      assert.deepStrictEqual(
        getObjectRestrictionsIntersection(verySpecificObjectRestrictions, null),
        verySpecificObjectRestrictions,
      );

      assert.deepStrictEqual(
        getObjectRestrictionsIntersection(null, verySpecificObjectRestrictions),
        verySpecificObjectRestrictions,
      );
    });
  });

  describe('test isPrimitive function', () => {
    it('should return true for strings', () => {
      assert.strictEqual(isPrimitive('string'), true);
      assert.strictEqual(isPrimitive('number'), true);
      assert.strictEqual(isPrimitive('boolean'), true);
      assert.strictEqual(isPrimitive(''), true);
    });

    it('should return false for non-strings', () => {
      assert.strictEqual(isPrimitive(123), false);
      assert.strictEqual(isPrimitive(true), false);
      assert.strictEqual(isPrimitive(null), false);
      assert.strictEqual(isPrimitive(undefined), false);
      assert.strictEqual(isPrimitive({}), false);
      assert.strictEqual(isPrimitive([]), false);
      assert.strictEqual(isPrimitive(() => {}), false);
    });
  });

  describe('test isObject function', () => {
    it('should return true for plain objects', () => {
      assert.strictEqual(isObject({}), true);
      assert.strictEqual(isObject({ a: 1, b: 'two' }), true);
    });

    it('should return false for null', () => {
      assert.strictEqual(isObject(null), false);
    });

    it('should return false for arrays', () => {
      assert.strictEqual(isObject([]), false);
      assert.strictEqual(isObject([1, 2, 3]), false);
    });

    it('should return false for primitives and undefined', () => {
      assert.strictEqual(isObject('string'), false);
      assert.strictEqual(isObject(123), false);
      assert.strictEqual(isObject(true), false);
      assert.strictEqual(isObject(undefined), false);
    });
  });

  describe('test bothArePrimitive function', () => {
    it('should return true when both are strings', () => {
      assert.strictEqual(bothArePrimitive('string', 'number'), true);
      assert.strictEqual(bothArePrimitive('boolean', ''), true);
    });

    it('should return false when the first is not a string', () => {
      assert.strictEqual(bothArePrimitive(123, 'string'), false);
      assert.strictEqual(bothArePrimitive(null, 'string'), false);
    });

    it('should return false when the second is not a string', () => {
      assert.strictEqual(bothArePrimitive('string', 123), false);
      assert.strictEqual(bothArePrimitive('string', {}), false);
    });

    it('should return false when neither are strings', () => {
      assert.strictEqual(bothArePrimitive(123, true), false);
      assert.strictEqual(bothArePrimitive({}, []), false);
    });
  });

  describe('test arrayIntersectionCondition function', () => {
    it('should return true for two arrays', () => {
      assert.strictEqual(arrayIntersectionCondition([], []), true);
    });

    it('should return true for an array and null (in either order)', () => {
      assert.strictEqual(arrayIntersectionCondition([], null), true);
      assert.strictEqual(arrayIntersectionCondition(null, []), true);
    });

    it('should return false for two nulls', () => {
      assert.strictEqual(arrayIntersectionCondition(null, null), false);
    });

    it('should return false if one or both are objects', () => {
      assert.strictEqual(arrayIntersectionCondition([], {}), false);
      assert.strictEqual(arrayIntersectionCondition({}, []), false);
      assert.strictEqual(arrayIntersectionCondition({}, null), false);
    });

    it('should return false if one or both are primitives', () => {
      assert.strictEqual(arrayIntersectionCondition([], 'str'), false);
      assert.strictEqual(arrayIntersectionCondition('str', []), false);
      assert.strictEqual(arrayIntersectionCondition('str', 'str'), false);
      assert.strictEqual(arrayIntersectionCondition('str', null), false);
    });
  });

  describe('test objectIntersectionCondition function', () => {
    it('should return true for two objects', () => {
      assert.strictEqual(objectIntersectionCondition({}, {}), true);
    });

    it('should return true for an object and null (in either order)', () => {
      assert.strictEqual(objectIntersectionCondition({}, null), true);
      assert.strictEqual(objectIntersectionCondition(null, {}), true);
    });

    it('should return false for two nulls', () => {
      assert.strictEqual(objectIntersectionCondition(null, null), false);
    });

    it('should return false if one or both are arrays', () => {
      assert.strictEqual(objectIntersectionCondition({}, []), false);
      assert.strictEqual(objectIntersectionCondition([], {}), false);
      assert.strictEqual(objectIntersectionCondition([], null), false);
    });

    it('should return false if one or both are primitives', () => {
      assert.strictEqual(objectIntersectionCondition({}, 'str'), false);
      assert.strictEqual(objectIntersectionCondition('str', {}), false);
      assert.strictEqual(objectIntersectionCondition('str', 'str'), false);
      assert.strictEqual(objectIntersectionCondition('str', null), false);
    });
  });
});
