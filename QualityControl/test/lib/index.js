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

describe('Lib Test Suite', async () => {
  require('./config/public-config.test.js');

  require('./controllers/layout-controller.test.js');
  require('./controllers/object-controller.test.js');
  require('./controllers/status-controller.test.js');

  require('./services/ccdb-service.test.js');
  require('./services/json-service.test.js');
  require('./services/user-service.test.js');

  require('./utils/utils.test.js');
});
