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
const {
  computeRestrictions,
  computeArrayRestrictions,
  deriveValueType,
  getRestrictionsIntersection,
} = QCConfigurationAdapter;

describe(`'QCConfigurationAdapter' test suite`, () => {
  describe('test computeRestrictions function', () => {
    it('should work for minimal input', () => {
      const configuration = {};
      const restrictions = {};

      assert.deepStrictEqual(computeRestrictions(configuration), restrictions);
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

      assert.deepStrictEqual(computeRestrictions(configuration), expected);
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
    });

    it('should not treat malformed numbers as numeric', () => {
      assert.equal(deriveValueType("1.2.3"), "string");
      assert.equal(deriveValueType("ten"), "string");
      assert.equal(deriveValueType("true-ish"), "string");
    });

    it('should handle object arguments properly', () => {
      const computeRestrictionsSpy = sinon.spy(
        QCConfigurationAdapter,
        'computeRestrictions'
      );
      // for object arguments, the computeRestrictions function should be called
      deriveValueType(0);
      assert.equal(computeRestrictionsSpy.notCalled, true);
      deriveValueType({});
      assert.equal(computeRestrictionsSpy.calledOnce, true);
      QCConfigurationAdapter.computeRestrictions.restore();
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
      QCConfigurationAdapter.computeArrayRestrictions.restore();
    });
  });

  describe('test computeArrayRestrictions function', () => {
    it('should return base case for empty array', () => {
      assert.deepStrictEqual(computeArrayRestrictions([]), [[], null, null]);
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
        [
          { name: "string", type: "string" },
          { name: "string" },
        ],
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

    it('should ignore primitives when finding an intersection of types included in the array', () => {
      const expectedRestrictions1 = [['number', 'boolean', 'string'], null, null];
      const expectedRestrictions2 = [[{ type: 'string'}, 'string'], { type: 'string'}, null];
      assert.deepStrictEqual(computeArrayRestrictions(['0', false, 'text']), expectedRestrictions1);
      assert.deepStrictEqual(computeArrayRestrictions([{ type: 'flp'}, 'text']), expectedRestrictions2);
    });

    it('should properly intersect the blueprint value for nested arrays', () => {
      const inputArray = [
        { type: 'flp', active: false },
        'ignored-for-type-intersection',
        { type: 'ctp' , active: 'no' },
        [{ id: 0, active: true }, 'also-ignored'],
        [{ id: 0, active: 'yes' }]
      ];

      const expectedRestrictions = [
        [
          { type: 'string', active: 'boolean'},
          'string',
          { type: 'string', active: 'string'},
          [[{ id: 'number', active: 'boolean' }, 'string'], { id: 'number', active: 'boolean' }, {}],
          [[{ id: 'number', active: 'string' }], { id: 'number', active: 'string' }, {}],
        ],
        { type: 'string' },
        { id: 'number' },
      ];

      assert.deepStrictEqual(computeArrayRestrictions(inputArray), expectedRestrictions);
    });

    it('should properly intersect blueprints of directly nested arrays', () => {
      const firstArray = [{ name: 'flp', active: 'yes' }];
      const firstArrayRestrictions = [[{ name: 'string', active: 'string' }], { name: 'string', active: 'string'}];
      const secondArray = [{ name: 'also-flp', active: true }];
      const secondArrayRestrictions = [[{ name: 'string', active: 'boolean' }], { name: 'string', active: 'boolean'}];
      const expectedRestrictions = [[firstArrayRestrictions, secondArrayRestrictions], { name: 'string' }];
      assert.deepStrictEqual(computeArrayRestrictions([firstArray, secondArray]), expectedRestrictions);
    });

    it('should properly propagate and intersect blueprints of nested arrays', () => {
      const innerArray1 = [{ one: 1, two: 2, three: 3 }];
      const innerArray1Restrictions = [
        [{ one: 'number', two: 'number', three: 'number' }], // content Restrictions
        { one: 'number', two: 'number', three: 'number' }, // blueprint for a new object created
        null // blueprint for a new array created, null because array does not contain other arrays
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
        null, // null because array does not contain any objects
        [{ one: 'number', three: 'number' }, null]
      ]
      const secondArray = ['text', { key: true }, innerArray3];
      const secondArrayRestrictions = [
        ['string', { key: 'boolean' }, innerArray3Restrictions],
        { key: 'boolean' },
        [innerArray3Restrictions[1], innerArray3Restrictions[2]]
      ];

      const bigArray = [firstArray, secondArray];
      const bigArrayRestrictions = [
        [firstArrayRestrictions, secondArrayRestrictions],
        null, // null because array does not contain any objects
        [{ key: 'boolean' }, [{ one: 'number' }, null]] // this inner array blueprint contains
        // recursive definition for inner arrays because there is a two-level-deep nested array
      ]

      assert.deepStrictEqual(computeArrayRestrictions(innerArray1), innerArray1Restrictions);
      assert.deepStrictEqual(computeArrayRestrictions(innerArray2), innerArray2Restrictions);
      assert.deepStrictEqual(computeArrayRestrictions(innerArray3), innerArray3Restrictions);
      assert.deepStrictEqual(computeArrayRestrictions(firstArray), firstArrayRestrictions);
      assert.deepStrictEqual(computeArrayRestrictions(secondArray), secondArrayRestrictions);
      assert.deepStrictEqual(computeArrayRestrictions(bigArray), bigArrayRestrictions);
    });
  });

  describe('test getRestrictionsIntersection', () => {
    it('does not fail for bad input', () => {
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

    it('does find the proper intersection', () => {
      const first = { test: 'string', id: 'number', active: 'boolean' };
      const second = { test: 'string', id: 'number', list: [[{ key: 'string' }], { key: 'string' }, null] };
      const third = { active: 'boolean', list: [[{ key: 'string' }], { key: 'string' }, null] }
      assert.deepStrictEqual(getRestrictionsIntersection(first, second), { test: 'string', id: 'number' });
      assert.deepStrictEqual(getRestrictionsIntersection(first, third), { active: 'boolean' });
      assert.deepStrictEqual(
        getRestrictionsIntersection(second, third),
        { list: [[{ key: 'string' }], { key: 'string' }, null] },
      );
      assert.deepStrictEqual(
        getRestrictionsIntersection(getRestrictionsIntersection(first, second), third),
        {}
      );
    });

    it('should intersect nested arrays correctly', () => {
      const first = {
        list: [
          [{ id: "number" }],
          { id: "number" },
          null
        ]
      };

      const second = {
        list: [
          [{ id: "number", active: "boolean" }],
          { id: "number" },
          null
        ]
      };

      const expected = {
        list: [
          [{ id: "number" }],
          { id: "number" },
          null
        ]
      };

      assert.deepStrictEqual(getRestrictionsIntersection(first, second), expected);
    });

    it('should return empty object when no keys intersect', () => {
      const first = { nested: { name: "string" } };
      const second = { nested: { id: "number" } };

      assert.deepStrictEqual(getRestrictionsIntersection(first, second), { nested: {} });
    });

  });
});
