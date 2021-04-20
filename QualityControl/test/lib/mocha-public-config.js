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

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const config = require('../test-config.js');

const {buildPublicConfig} = require('../../lib/config/publicConfigProvider');

describe('Public Configuration Test Suite', () => {
  const CONF_LOCATION = '../../public/config.js';
  it('should successfully create JS module with public configuration as export', () => {
    assert.doesNotThrow(() => buildPublicConfig(config));
  });

  it('should successfully import QCG public configuration', async () => {
    const confExists = fs.existsSync(path.join(__dirname, CONF_LOCATION));
    assert.ok(confExists, 'Public configuration file was not identified');
  });
});
