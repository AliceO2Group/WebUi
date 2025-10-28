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
import { TabData } from '../../../../lib/utils/download/classes/data/TabData.js';
import { TabDomain } from '../../../../lib/utils/download/classes/domain/TabDomain.js';
import { LayoutData } from '../../../../lib/utils/download/classes/data/LayoutData.js';
import { LayoutDomain } from '../../../../lib/utils/download/classes/domain/LayoutDomain.js';
import { LayoutDomainStorage } from '../../../../lib/utils/download/classes/domain/LayoutDomainStorage.js';

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

// -----------------------
// Tab fixtures
// -----------------------
const plainObjFull = {
  id: 'obj-1',
  x: 1,
  y: 2,
  h: 3,
  w: 4,
  name: 'some/name',
  options: [],
  autoSize: false,
  ignoreDefaults: false,
};

const plainObjSlim = {
  id: 'obj-2',
  name: 'other/name',
};

const expectObjFull = new ObjectData('obj-1', 1, 2, 3, 4, 'some/name', [], false, false);
const expectObjSlim = new ObjectData('obj-2', 0, 0, 0, 0, 'other/name', [], false, false);

const expectDomainObjFull = expectObjFull.mapToDomain();
const expectDomainObjSlim = expectObjSlim.mapToDomain();

// Tab with full info
const plainFullTab = {
  id: 'tab-1',
  name: 'Tab One',
  objects: [plainObjFull, plainObjSlim],
  columns: 3,
};

const expectFullTab = new TabData('tab-1', 'Tab One', [expectObjFull, expectObjSlim], 3);
const expectDomainFullTab = new TabDomain('tab-1', 'Tab One', [expectDomainObjFull, expectDomainObjSlim]);

// Tab with minimal info (objects empty)
const plainSlimTab = {
  id: 'tab-2',
  name: 'Tab Two',
  columns: 0,
};

const expectSlimTab = new TabData('tab-2', 'Tab Two', [], 0);

// Tab missing id (invalid for mapping to domain)
const plainInvalidTab = {
  name: 'NoIdTab',
  objects: [plainObjSlim],
  columns: 1,
};

const expectInvalidTab = new TabData(undefined, 'NoIdTab', [expectObjSlim], 1);

// -----------------------
// Layout fixtures
// -----------------------
const plainObj = {
  id: 'obj-a',
  name: 'name/a',
};
const expectObj = new ObjectData('obj-a', 0, 0, 0, 0, 'name/a', [], false, false);

const plainTab = {
  id: 'tab-a',
  name: 'Tab A',
  objects: [plainObj],
  columns: 2,
};
const expectTab = new TabData('tab-a', 'Tab A', [expectObj], 2);
const expectDomainTab = expectTab.mapToDomain();

// layout with full info
const plainFullLayout = {
  id: 'layout-1',
  name: 'Layout One',
  owner_id: 123,
  owner_name: 'owner',
  tabs: [plainTab],
  collaborators: [{ id: 1 }],
  displayTimestamp: true,
  autoTabChange: 5,
  isOfficial: false,
};

const expectFullLayout = new LayoutData('layout-1', 'Layout One', 123, 'owner', [expectTab], [{ id: 1 }], true, 5, false);
const expectDomainFullLayout = new LayoutDomain('layout-1', 'Layout One', [expectDomainTab]);

// layout missing tabs (empty tabs array) - invalid for domain mapping
const plainLayoutEmptyTabs = {
  id: 'layout-2',
  name: 'Empty Tabs',
  owner_id: 0,
  owner_name: 'nobody',
  tabs: [],
  collaborators: [],
  displayTimestamp: false,
  autoTabChange: 0,
  isOfficial: false,
};
const expectEmptyTabsLayout = new LayoutData('layout-2', 'Empty Tabs', 0, 'nobody', [], [], false, 0, false);

// layout missing id -> mapFromPlain should throw
const plainInvalidLayout = {
  name: 'Bad Layout',
  owner_id: 1,
  owner_name: 'x',
  tabs: [plainTab],
};

// -----------------------
// LayoutDomainStorage fixtures
// -----------------------
const objDomain = new ObjectDomain('od-1', 'obj/name');
const tabDomain = new TabDomain('td-1', 'TabDomain', [objDomain]);

const expectDomain = new LayoutDomain('lds-1', 'LD S', [tabDomain]);

// Suites
export const downloadTestSuite = () => {
  suite('downloadMappers - test suite', () => {
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

    // Tab tests
    test('TabData: should successfully return TabData object from plain', () => {
      const t1 = TabData.mapFromPlain(plainFullTab);
      const t2 = TabData.mapFromPlain(plainSlimTab);
      const t3 = TabData.mapFromPlain(plainInvalidTab);

      deepStrictEqual(t1, expectFullTab);
      deepStrictEqual(t2, expectSlimTab);
      deepStrictEqual(t3, expectInvalidTab);
    });

    test('TabData: should handle domain mapping guards properly', () => {
      assert.doesNotThrow(() => {
        expectFullTab.mapToDomain();
      });

      // expectSlimTab has empty objects -> mapping to domain should throw
      assert.throws(() => {
        expectSlimTab.mapToDomain();
      });

      // expectInvalidTab has undefined id -> mapping to domain should throw
      assert.throws(() => {
        expectInvalidTab.mapToDomain();
      });
    });

    test('TabData: should handle domain mapping properly', () => {
      const domain = expectFullTab.mapToDomain();
      deepStrictEqual(expectDomainFullTab, domain);
    });

    // Layout tests
    test('LayoutData: should successfully return LayoutData object from plain', () => {
      const l1 = LayoutData.mapFromPlain(plainFullLayout);
      deepStrictEqual(l1, expectFullLayout);

      const l2 = LayoutData.mapFromPlain(plainLayoutEmptyTabs);
      deepStrictEqual(l2, expectEmptyTabsLayout);

      assert.throws(() => {
        LayoutData.mapFromPlain(plainInvalidLayout);
      });
    });

    test('LayoutData: should handle domain mapping guards properly', () => {
      assert.doesNotThrow(() => {
        expectFullLayout.mapToDomain();
      });

      // layout with empty tabs should throw when mapping to domain
      assert.throws(() => {
        expectEmptyTabsLayout.mapToDomain();
      });
    });

    test('LayoutData: should handle domain mapping properly', () => {
      const domain = expectFullLayout.mapToDomain();
      deepStrictEqual(expectDomainFullLayout, domain);
    });

    // LayoutDomainStorage tests
    test('LayoutDomainStorage: should construct when downloadUserId != 0', () => {
      assert.doesNotThrow(() => {
        new LayoutDomainStorage('lds-1', 'LD S', [tabDomain], 42);
      });
      const ls = new LayoutDomainStorage('lds-1', 'LD S', [tabDomain], 42);
      deepStrictEqual(ls.toSuper(), expectDomain);
      deepStrictEqual(ls.downloadUserId, 42);
    });

    test('LayoutDomainStorage: should throw when downloadUserId == 0', () => {
      assert.throws(() => {
        new LayoutDomainStorage('lds-1', 'LD S', [tabDomain], 0);
      });
    });
  });
};
