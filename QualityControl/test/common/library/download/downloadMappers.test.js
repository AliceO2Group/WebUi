/* eslint-disable @stylistic/js/max-len */
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

import { suite, test } from 'node:test';
import assert, { deepStrictEqual } from 'node:assert';
import { ObjectData } from '../../../../lib/utils/download/classes/data/ObjectData.js';
import { ObjectDomain } from '../../../../lib/utils/download/classes/domain/ObjectDomain.js';

// Typical example of an object, with all info included, should map just fine.
const plainFullObjectObject = {
  id: 'a379543d-a93c-11ef-9af4-0aa14016a1a2',
  x: 0,
  y: 0,
  h: 1,
  w: 1,
  name: 'qc/CPV/MO/NoiseOnFLP/BadChannelMapM2',
  options: [],
  autoSize: false,
  ignoreDefaults: false,
};
// data
const expectFullObject = new ObjectData('a379543d-a93c-11ef-9af4-0aa14016a1a2', 0, 0, 1, 1, 'qc/CPV/MO/NoiseOnFLP/BadChannelMapM2', [], false, false);
// domain
const expectDomainFullOject = new ObjectDomain('a379543d-a93c-11ef-9af4-0aa14016a1a2', 'qc/CPV/MO/NoiseOnFLP/BadChannelMapM2');

// Object that has just enough information to be mapped to domain.
const plainSlimObjectObject = {
  id: 'a379543d-a93c-11ef-9af4-0aa14016a1a2',
  name: 'qc/CPV/MO/NoiseOnFLP/BadChannelMapM2',
};

// data
const expectSlimObject = new ObjectData('a379543d-a93c-11ef-9af4-0aa14016a1a2', 0, 0, 0, 0, 'qc/CPV/MO/NoiseOnFLP/BadChannelMapM2', [], false, false);
// domain
const expectDomainSlimObject = new ObjectDomain('a379543d-a93c-11ef-9af4-0aa14016a1a2', 'qc/CPV/MO/NoiseOnFLP/BadChannelMapM2');

// Object that misses the required id and thus is invalid when mapped to domain.
const plainEmptybjectObject = {
  // id: "a379543d-a93c-11ef-9af4-0aa14016a1a2",
  // x: 0,
  // y: 0,
  // h: 1,
  // w: 1,
  name: 'qc/CPV/MO/NoiseOnFLP/BadChannelMapM2',
  // options: [],
  // autoSize: false,
  // ignoreDefaults: false
};

const expectEmptyobject = new ObjectData(undefined, 0, 0, 0, 0, 'qc/CPV/MO/NoiseOnFLP/BadChannelMapM2', [], false, false);

export const downloadTestSuite = () => {
  suite('downloadMappers Object - test suite', () => {
    test('should successfully return Data object', () => {
      const obj1 = ObjectData.mapFromPlain(plainFullObjectObject);
      const obj2 = ObjectData.mapFromPlain(plainSlimObjectObject);
      const obj3 = ObjectData.mapFromPlain(plainEmptybjectObject);
      deepStrictEqual(obj1, expectFullObject);
      deepStrictEqual(obj2, expectSlimObject);
      deepStrictEqual(obj3, expectEmptyobject);
    });

    test('should handle domain mapping guards properly', () => {
      assert.doesNotThrow(() => {
        expectFullObject.mapToDomain();
      });
      assert.doesNotThrow(() => {
        expectSlimObject.mapToDomain();
      });
      assert.throws(() => {
        expectEmptyobject.mapToDomain();
      });
    });

    test('should handle domain mapping properly', () => {
      const domainFullObject = expectFullObject.mapToDomain();
      const domainSlimObject = expectSlimObject.mapToDomain();

      deepStrictEqual(expectDomainFullOject, domainFullObject);
      deepStrictEqual(expectDomainSlimObject, domainSlimObject);
    });
  });
};
