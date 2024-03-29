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
import utilsTestSuite from './lib/utils/utils.test.js';
import configurationTestSuite from './lib/config/public-config.test.js';

/**
 * Controllers
 */
import { layoutControllerTestSuite } from './lib/controllers/LayoutController.test.js';
import { statusControllerTestSuite } from './lib/controllers/status-controller.test.js';

/**
 * Services
 */
import { ccdbServiceTestSuite } from './lib/services/ccdb-service.test.js';
import { statusServiceTestSuite } from './lib/services/status-service.test.js';

import { commonLibraryQcObjectUtilsTestSuite as objectUtilityTestSuite } from './common/library/qcObject/utils.test.js';
import {
  commonLibraryUtilsDateTimeTestSuite as dateTimeUtilityTestSuite,
} from './common/library/utils/dateTimeFormat.test.js';

describe('Lib - Test Suite', async () => {
  describe('Utility methods test suite', async () => await utilsTestSuite());
  describe('Configuration File Parser test suite', async () => await configurationTestSuite());
});

describe('Common Library - Test Suite', () => {
  describe('CL - Object Utility methods test suite', () => objectUtilityTestSuite());
  describe('CL - DateTime Utility methods test suite', () => dateTimeUtilityTestSuite());
});

describe('Services - Test Suite', async () => {
  describe('CcdbService - Test Suite', async () => await ccdbServiceTestSuite());
  describe('StatusService - Test Suite', async () => await statusServiceTestSuite());
});

describe('Controllers - Test Suite', async () => {
  describe('LayoutController test suite', async () => await layoutControllerTestSuite());
  describe('StatusController test suite', async () => await statusControllerTestSuite());
});
