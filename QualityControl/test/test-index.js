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

const FRONT_END_TIMEOUT = 20000; // front-end test suite timeout
const BACK_END_TIMEOUT = 1000; // back-end test suite timeout

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
      async (testParent) => await initialPageSetupTests(url, page, 3000, testParent),
    );
    test.skip(
      'should successfully import and run tests for QC drawing options',
      async (testParent) => await qcDrawingOptionsTests(url, page, 1000, testParent),
    );

    test.skip(
      'pages tests to add',
      async () => {
        // TODO
        // require('./layout-list.test');
        // require('./object-tree.test');
        // require('./layout-view.test');
        // require('./object-view.test');
        // require('./about-page.test');
      },
    );
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
