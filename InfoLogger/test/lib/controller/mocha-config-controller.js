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
const { LogManager, updateAndSendExpressResponseFromNativeError } = require('@aliceo2/web-ui');
const { ConfigController } = require('./../../../lib/controller/ConfigController.js');

describe('ConfigController - test suite', () => {
  let configMock, loggerMock, resMock;

  beforeEach(() => {
    configMock = { bookkeeping: { url: 'http://bookkeeping.com' } };
    loggerMock = { errorMessage: sinon.stub() };
    sinon.stub(LogManager, 'getLogger').returns(loggerMock);
    resMock = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor - test suite', () => {
    it('should initialize _config and _logger correctly', () => {
      const controller = new ConfigController(configMock);
      assert.deepStrictEqual(controller._config, configMock);
      assert.strictEqual(controller._logger, loggerMock);
    });

    it('should initialize _config as an empty object if no config is provided', () => {
      const controller = new ConfigController();
      assert.deepStrictEqual(controller._config, {});
    });
  });

  describe('getConfigurationHandler', () => {
    it('should successfully return configuration', async () => {
      const controller = new ConfigController(configMock);
      await controller.getConfigurationHandler(null, resMock);

      assert.ok(resMock.status.calledWith(200));
      assert.ok(resMock.json.calledWith({
        bookkeeping: { url: 'http://bookkeeping.com' },
      }));
    });
  });
});
