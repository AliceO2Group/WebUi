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

import { suite, before, test, after } from 'node:test';
import {
  setupServerForIntegrationTests,
  terminateSessionAndLog,
} from './setup/testServerSetup.js';

/**
 * Frontend tests imports
 * Move to NodeJS Test Runner:
 * * due to mocha not allowing test dependency such as parent-child to wait for async functions
 * * due to mocha's and ES6 `describe` hook not waiting for `before hook` and async functions in separate files
 * * the goal to reducing dependencies and keeping the test files as simple as possible
 * the tests are imported and run here with NodeJS Test Runner which replaces (mocha, nyc, sinon, nock)
 */

import { initialPageSetupTests } from './public/initialPageSetup.test.js';
import { qcDrawingOptionsTests } from './public/components/qcDrawingOptions.test.js';
import { layoutListPageTests } from './public/pages/layout-list.test.js';
import { objectTreePageTests } from './public/pages/object-tree.test.js';
import { objectViewFromObjectTreeTests } from './public/pages/object-view-from-object-tree.test.js';
import { objectViewFromLayoutShowTests } from './public/pages/object-view-from-layout-show.test.js';

/**
 * Backend tests imports
 */
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

const FRONT_END_PER_TEST_TIMEOUT = 5000; // each front-end test is allowed this timeout
// remaining tests are based on the number of individual tests in each suite

const INITIAL_PAGE_SETUP_TIMEOUT = FRONT_END_PER_TEST_TIMEOUT * 5;
const QC_DRAWING_OPTIONS_TIMEOUT = FRONT_END_PER_TEST_TIMEOUT * 13;
const LAYOUT_LIST_PAGE_TIMEOUT = FRONT_END_PER_TEST_TIMEOUT * 6;
const OBJECT_TREE_PAGE_TIMEOUT = FRONT_END_PER_TEST_TIMEOUT * 6;

const FRONT_END_TIMEOUT = INITIAL_PAGE_SETUP_TIMEOUT
  + QC_DRAWING_OPTIONS_TIMEOUT
  + LAYOUT_LIST_PAGE_TIMEOUT
  + OBJECT_TREE_PAGE_TIMEOUT; // front-end test suite timeout

const BACK_END_TIMEOUT = 10000; // back-end test suite timeout

suite('All Tests - QCG', { timeout: FRONT_END_TIMEOUT + BACK_END_TIMEOUT }, async () => {
  suite('Front-end test suite', { timeout: FRONT_END_TIMEOUT }, async () => {
    let url = undefined;
    let page = undefined;
    let browser = undefined;
    let subprocess = undefined;
    let subprocessOutput = undefined;

    before(async () => {
      ({ page, url, browser, subprocess, subprocessOutput } = await setupServerForIntegrationTests());
    }, { timeout: 5000 });

    after(async () => {
      await terminateSessionAndLog(browser, subprocessOutput, subprocess);
    });

    test(
      'should successfully import and run the tests for page setup',
      async (testParent) => await initialPageSetupTests(url, page, FRONT_END_PER_TEST_TIMEOUT, testParent),
    );
    test.skip(
      'should successfully import and run tests for QC drawing options',
      async (testParent) => await qcDrawingOptionsTests(url, page, FRONT_END_PER_TEST_TIMEOUT, testParent),
    );

    test(
      'should successfully run layoutList page tests',
      { timeout: LAYOUT_LIST_PAGE_TIMEOUT },
      async (testParent) => await layoutListPageTests(url, page, FRONT_END_PER_TEST_TIMEOUT, testParent),
    );

    test(
      'should successfully run objectTree page tests with CCDB mocked with nock',
      { timeout: OBJECT_TREE_PAGE_TIMEOUT },
      async (testParent) => await objectTreePageTests(url, page, FRONT_END_PER_TEST_TIMEOUT, testParent),
    );

    test(
      'should successfully run objectView page tests from object tree with CCDB mocked with nock',
      { timeout: OBJECT_TREE_PAGE_TIMEOUT },
      async (testParent) => await objectViewFromObjectTreeTests(url, page, FRONT_END_PER_TEST_TIMEOUT, testParent),
    );

    test(
      'should successfully run objectView page from layout show tests with CCDB mocked with nock',
      { timeout: OBJECT_TREE_PAGE_TIMEOUT },
      async (testParent) => await objectViewFromLayoutShowTests(url, page, FRONT_END_PER_TEST_TIMEOUT, testParent),
    );

    // require('./layout-view.test');
    // require('./about-page.test');
  });

  suite('Back-end test suite', { timeout: BACK_END_TIMEOUT }, async () => {
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
  });
});
