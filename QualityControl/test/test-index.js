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
import { layoutShowTests } from './public/pages/layout-show.test.js';
import { aboutPageTests } from './public/pages/about-page.test.js';

/**
 * Backend tests imports
 */
import { errorHandlerTestSuite } from './lib/utils/errorHandler.test.js';
import { httpRequestsTestSuite } from './lib/utils/httpRequests.test.js';

/**
 * Controllers
 */
import { layoutControllerTestSuite } from './lib/controllers/LayoutController.test.js';
import { statusControllerTestSuite } from './lib/controllers/StatusController.test.js';
import { filtersControllerTestSuite } from './lib/controllers/FiltersController.test.js';
import { objectControllerTestSuite } from './lib/controllers/ObjectController.test.js';

/**
 * Services
 */
import { ccdbServiceTestSuite } from './lib/services/CcdbService.test.js';
import { statusServiceTestSuite } from './lib/services/StatusService.test.js';
import { bookkeepingServiceTestSuite } from './lib/services/BookkeepingService.test.js';

import { commonLibraryQcObjectUtilsTestSuite } from './common/library/qcObject/utils.test.js';
import { commonLibraryUtilsDateTimeTestSuite } from './common/library/utils/dateTimeFormat.test.js';
import { layoutIdMiddlewareTest } from './lib/middlewares/layouts/layoutId.middleware.test.js';
import { layoutOwnerMiddlewareTest } from './lib/middlewares/layouts/layoutOwner.middleware.test.js';
import { layoutServiceMiddlewareTest } from './lib/middlewares/layouts/layoutService.middleware.test.js';
import { statusComponentMiddlewareTest } from './lib/middlewares/status/statusComponent.middleware.test.js';
import { runModeMiddlewareTest } from './lib/middlewares/filters/runMode.middleware.test.js';
import { runStatusFilterMiddlewareTest } from './lib/middlewares/filters/runStatusFilter.middleware.test.js';
import { apiPutLayoutTests } from './api/layouts/api-put-layout.test.js';
import { apiPatchLayoutTests } from './api/layouts/api-patch-layout.test.js';
import { layoutRepositoryTest } from './lib/repositories/LayoutRepository.test.js';
import { userRepositoryTest } from './lib/repositories/UserRepository.test.js';
import { jsonFileServiceTestSuite } from './lib/services/JsonFileService.test.js';
import { userControllerTestSuite } from './lib/controllers/UserController.test.js';
import { chartRepositoryTest } from './lib/repositories/ChartRepository.test.js';
import { filterServiceTestSuite } from './lib/services/FilterService.test.js';
import { apiGetLayoutsTests } from './api/layouts/api-get-layout.test.js';
import { apiGetObjectsTests } from './api/objects/api-get-object.test.js';
import { objectsGetValidationMiddlewareTest } from './lib/middlewares/objects/objectsGetValidation.middleware.test.js';
import { objectGetContentsValidationMiddlewareTest }
  from './lib/middlewares/objects/objectGetByContentsValidation.middleware.test.js';
import { objectGetByIdValidationMiddlewareTest }
  from './lib/middlewares/objects/objectGetByIdValidation.middleware.test.js';
import { filterTests } from './public/features/filterTest.test.js';
import { qcObjectServiceTestSuite } from './lib/services/QcObjectService.test.js';
import { runModeServiceTestSuite } from './lib/services/RunModeService.test.js';
import { apiGetRunStatusTests } from './api/filters/api-get-run-status.test.js';
import { runModeTests } from './public/features/runMode.test.js';

const FRONT_END_PER_TEST_TIMEOUT = 5000; // each front-end test is allowed this timeout
// remaining tests are based on the number of individual tests in each suite

const INITIAL_PAGE_SETUP_TIMEOUT = FRONT_END_PER_TEST_TIMEOUT * 5;
const QC_DRAWING_OPTIONS_TIMEOUT = FRONT_END_PER_TEST_TIMEOUT * 13;
const LAYOUT_LIST_PAGE_TIMEOUT = FRONT_END_PER_TEST_TIMEOUT * 6;
const OBJECT_TREE_PAGE_TIMEOUT = FRONT_END_PER_TEST_TIMEOUT * 6;
const OBJECT_VIEW_FROM_OBJECT_TREE_PAGE_TIMEOUT = FRONT_END_PER_TEST_TIMEOUT * 5;
const OBJECT_VIEW_FROM_LAYOUT_SHOW_PAGE_TIMEOUT = FRONT_END_PER_TEST_TIMEOUT * 4;
const LAYOUT_SHOW_PAGE_TIMEOUT = FRONT_END_PER_TEST_TIMEOUT * 23;
const ABOUT_VIEW_PAGE_TIMEOUT = FRONT_END_PER_TEST_TIMEOUT * 4;

const FRONT_END_TIMEOUT = INITIAL_PAGE_SETUP_TIMEOUT
  + QC_DRAWING_OPTIONS_TIMEOUT
  + LAYOUT_LIST_PAGE_TIMEOUT
  + OBJECT_TREE_PAGE_TIMEOUT
  + OBJECT_VIEW_FROM_OBJECT_TREE_PAGE_TIMEOUT
  + OBJECT_VIEW_FROM_LAYOUT_SHOW_PAGE_TIMEOUT
  + LAYOUT_SHOW_PAGE_TIMEOUT;

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
      { timeout: OBJECT_VIEW_FROM_OBJECT_TREE_PAGE_TIMEOUT },
      async (testParent) => await objectViewFromObjectTreeTests(url, page, FRONT_END_PER_TEST_TIMEOUT, testParent),
    );

    test(
      'should successfully run objectView page from layout show tests with CCDB mocked with nock',
      { timeout: OBJECT_VIEW_FROM_LAYOUT_SHOW_PAGE_TIMEOUT },
      async (testParent) => await objectViewFromLayoutShowTests(url, page, FRONT_END_PER_TEST_TIMEOUT, testParent),
    );

    test(
      'should successfully run layoutShow page tests',
      { timeout: LAYOUT_SHOW_PAGE_TIMEOUT },
      async (testParent) => await layoutShowTests(url, page, FRONT_END_PER_TEST_TIMEOUT, testParent),
    );

    test(
      'should successfully run about page tests',
      { timeout: ABOUT_VIEW_PAGE_TIMEOUT },
      async (testParent) => await aboutPageTests(url, page, FRONT_END_PER_TEST_TIMEOUT, testParent),
    );
    test('should successfully import and run tests for filter', async (testParent) =>
      filterTests(url, page, FRONT_END_PER_TEST_TIMEOUT, testParent));

    test('should successfully use run mode when available', async (testParent) =>
      await runModeTests(url, page, FRONT_END_PER_TEST_TIMEOUT, testParent));
  });

  suite('API - test suite', { timeout: FRONT_END_TIMEOUT }, async () => {
    let browser = undefined;
    let subprocess = undefined;
    let subprocessOutput = undefined;

    before(async () => {
      ({ browser, subprocess, subprocessOutput } = await setupServerForIntegrationTests());
    }, { timeout: 5000 });

    after(async () => {
      await terminateSessionAndLog(browser, subprocessOutput, subprocess);
    });

    suite('Layout GET request test suite', async () => apiGetLayoutsTests());
    suite('Layout PUT request test suite', async () => apiPutLayoutTests());
    suite('Layout PATCH request test suite', async () => apiPatchLayoutTests());
    suite('Object GET request test suite', async () => apiGetObjectsTests());
    suite('Filters GET run status test suite', async () => await apiGetRunStatusTests());
  });

  suite('Back-end test suite', { timeout: BACK_END_TIMEOUT }, async () => {
    suite('Lib - Test Suite', async () => {
      suite('Utility "errorHandler" methods test suite', async () => await errorHandlerTestSuite());
      suite('Utility "httpRequests" methods test suite', async () => await httpRequestsTestSuite());
    });

    suite('Common Library - Test Suite', () => {
      suite('CL - Object Utility methods test suite', () => commonLibraryQcObjectUtilsTestSuite());
      suite('CL - DateTime Utility methods test suite', () => commonLibraryUtilsDateTimeTestSuite());
    });

    suite('Repositories - Test Suite', async () => {
      suite('Layout Repository - Test Suite', async () => await layoutRepositoryTest());
      suite('User Repository - Test Suite', async () => await userRepositoryTest());
      suite('Chart Repository - Test Suite', async () => await chartRepositoryTest());
    });

    suite('Services - Test Suite', async () => {
      suite('CcdbService - Test Suite', async () => await ccdbServiceTestSuite());
      suite('StatusService - Test Suite', async () => await statusServiceTestSuite());
      suite('JsonServiceTest test suite', async () => await jsonFileServiceTestSuite());
      suite('FilterService', async () => await filterServiceTestSuite());
      suite('RunModeService - Test Suite', async () => await runModeServiceTestSuite());
      suite('QcObjectService - Test Suite', async () => await qcObjectServiceTestSuite());
    });

    suite('Middleware - Test Suite', async () => {
      suite('LayoutServiceMiddleware test suite', async () => layoutServiceMiddlewareTest());
      suite('LayoutIdMiddleware test suite', async () => layoutIdMiddlewareTest());
      suite('LayoutOwnerMiddleware test suite', async () => layoutOwnerMiddlewareTest());
      suite('StatusComponentMiddleware test suite', async () => statusComponentMiddlewareTest());
      suite('RunModeMiddleware test suite', async () => runModeMiddlewareTest());
      suite('RunStatusFilterMiddleware test suite', async () => runStatusFilterMiddlewareTest());
      suite('BookkeepingServiceTest test suite', async () => await bookkeepingServiceTestSuite());
      suite('ObjectsGetValidationMiddleware test suite', async () => objectsGetValidationMiddlewareTest());
      suite('ObjectGetContentsValidationMiddleware test suite', async () =>
        objectGetContentsValidationMiddlewareTest());
      suite('ObjectGetByIdValidationMiddleware test suite', async () => objectGetByIdValidationMiddlewareTest());
    });

    suite('Controllers - Test Suite', async () => {
      suite('LayoutController test suite', async () => await layoutControllerTestSuite());
      suite('StatusController test suite', async () => await statusControllerTestSuite());
      suite('ObjectController test suite', async () => await objectControllerTestSuite());
      suite('UserController - Test Suite', async () => await userControllerTestSuite());
      suite('FiltersController test suite', async () => await filtersControllerTestSuite());
    });
  });
});
