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
'use strict';

import { suite } from 'node:test';

import { utilsTestSuite } from './lib/utils/utils.test.js';
import { publicConfigProviderTest } from './lib/config/publicConfig.test.js';

/**
 * Controllers
 */
import { layoutControllerTestSuite } from './lib/controllers/LayoutController.test.js';
import { statusControllerTestSuite } from './lib/controllers/StatusController.test.js';

/**
 * Services
 */
import { ccdbServiceTestSuite } from './lib/services/CcdbService.test.js';
import { statusServiceTestSuite } from './lib/services/StatusService.test.js';

import { commonLibraryQcObjectUtilsTestSuite } from './common/library/qcObject/utils.test.js';
import { commonLibraryUtilsDateTimeTestSuite } from './common/library/utils/dateTimeFormat.test.js';

suite('Lib - Test Suite', async () => {
  suite('Utility methods test suite', async () => await utilsTestSuite());
  suite('Configuration File Parser test suite', async () => await publicConfigProviderTest());
});

suite('Common Library - Test Suite', () => {
  suite('CL - Object Utility methods test suite', () => commonLibraryQcObjectUtilsTestSuite());
  suite('CL - DateTime Utility methods test suite', () => commonLibraryUtilsDateTimeTestSuite());
});

suite('Services - Test Suite', async () => {
  suite('CcdbService - Test Suite', async () => await ccdbServiceTestSuite());
  suite('StatusService - Test Suite', async () => await statusServiceTestSuite());
  suite('JsonServiceTest test suite', async () => {
    // TODO - bring inline with current tests
  });
  suite('UserServiceTest test suite', async () => {
    // TODO - bring inline with current tests
  });
});

suite('Controllers - Test Suite', async () => {
  suite('LayoutController test suite', async () => await layoutControllerTestSuite());
  suite('StatusController test suite', async () => await statusControllerTestSuite());

  suite('ObjectController test suite', async () => {
    // TODO - bring inline with current tests
  });
});
