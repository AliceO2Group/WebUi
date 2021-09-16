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
/* eslint-disable max-len */

const sinon = require('sinon');
const path = require('path');
const assert = require('assert');
const AssertionError = require('assert').AssertionError;

const config = require('./../test-config.js');
const GrpcProxy = require('./../../lib/control-core/GrpcProxy.js');
const ApricotService = require('./../../lib/control-core/ApricotService.js');
const APRICOT_PATH = path.join(__dirname, './../../protobuf/o2apricot.proto');

describe('ApricotService test suite', () => {
  describe('Check Constructor', () => {
    it('should throw error due to null ApricotProxy dependency', () => {
      assert.throws(() => {
        new ApricotService(null);
      }, new AssertionError({message: 'Missing GrpcProxy dependency for Apricot', actual: null, expected: true, operator: '=='}));
    });

    it('should successfully instantiate ApricotService', () => {
      assert.doesNotThrow(() => new ApricotService({}));
    });
  });

  describe('Check executing commands through `GrpcProxy`', () => {
    let apricotService;
    let req, res;
    beforeEach(() => {
      apricotService = null;
      req = {
        session: {
          personid: 0
        },
        path: 'ListDetectors',
        body: {value: 'Test'}
      };
      res = {
        json: sinon.fake.returns(),
        status: sinon.fake.returns(),
        send: sinon.fake.returns()
      };
    });

    it('should successfully execute command, send response with status and message', async () => {
      const apricotProxy = {
        isConnectionReady: true,
        ListDetectors: sinon.stub().resolves(['TPC', 'TPA'])
      };
      apricotService = new ApricotService(apricotProxy);

      await apricotService.executeCommand(req, res);
      assert.ok(res.json.calledOnce);
      assert.ok(res.json.calledWith(['TPC', 'TPA']));
    });

    it('should attempt execute command but send response with error if connection is not ready and no connection error is provided', async () => {
      const apricotProxy = {isConnectionReady: false};
      apricotService = new ApricotService(apricotProxy);

      await apricotService.executeCommand(req, res);
      assert.ok(res.status.calledOnce);
      assert.ok(res.status.calledWith(503));
      assert.ok(res.send.calledOnce);
      assert.ok(res.send.calledWith({message: 'Could not establish connection to AliECS Core due to pontentially undefined method'}));
    });

    it('should attempt execute command but send response with error if connection is not ready and connection error is provided', async () => {
      const apricotProxy = {isConnectionReady: false, connectionError: {message: 'Something went wrong'}};
      apricotService = new ApricotService(apricotProxy);

      await apricotService.executeCommand(req, res);
      assert.ok(res.status.calledOnce);
      assert.ok(res.status.calledWith(503));
      assert.ok(res.send.calledOnce);
      assert.ok(res.send.calledWith({message: 'Something went wrong'}));
    });

    it('should attempt execute command but send response with error if method was not provided', async () => {
      const apricotProxy = {isConnectionReady: true};
      apricotService = new ApricotService(apricotProxy);
      req = {
        session: {
          personid: 0
        }, // missing path
        body: {value: 'Test'}
      };
      await apricotService.executeCommand(req, res);
      assert.ok(res.status.calledOnce);
      assert.ok(res.status.calledWith(503));
      assert.ok(res.send.calledOnce);
      assert.ok(res.send.calledWith({message: 'Could not establish connection to AliECS Core due to pontentially undefined method'}));
    });
  });

  describe('Check saving configuration via ApricotService ', () => {
    let apricotService;
    let req, res;
    beforeEach(() => {
      apricotService = null;
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
        send: sinon.fake.returns()
      };
    });

    it('should successfully save configuration', async () => {
      const body = {
        name: 'My TST Configuration',
        variables: {
          some_enabled: 'true',
          some_other: 'false',
          hosts: ['flp01']
        },
        detectors: ['TST'],
        workflow: 'readout',
        revision: 'master',
        repository: 'git/repo.git',
      };
      const session = {username: 'someuser', personid: 11};
      req = {body, session};

      const apricotProxy = {
        SetRuntimeEntry: sinon.stub().resolves(),
        ListRuntimeEntries: sinon.stub().resolves({payload: ['config1']})
      };
      apricotService = new ApricotService(apricotProxy);


      await apricotService.saveConfiguration(req, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledOnce);
      assert.ok(res.json.calledWith({message: 'Configuration saved successfully as My_TST_Configuration'}));
    });

    it('should reply with error due to bad configuration object', async () => {
      const body = {
        variables: {
          some_enabled: 'true',
          some_other: 'false',
          hosts: ['flp01']
        },
        detectors: ['TST'],
        workflow: 'readout',
        revision: 'master',
        repository: 'git/repo.git',
      };
      const session = {username: 'someuser', personid: 11};
      req = {body, session};

      const apricotProxy = {
        SetRuntimeEntry: sinon.stub().resolves(),
        ListRuntimeEntries: sinon.stub().resolves({payload: ['config1']})
      };
      apricotService = new ApricotService(apricotProxy);


      await apricotService.saveConfiguration(req, res);
      assert.ok(res.status.calledWith(503));
      assert.ok(res.send.calledOnce);
      assert.ok(res.send.calledWith({message: 'Configuration cannot be saved without the following fields: name'}));
    });

    it('should reply with error due to Apricot ListRuntimeEnttires call failure', async () => {
      const body = {
        name: 'Something went wrong',
        variables: {
          some_enabled: 'true',
          some_other: 'false',
          hosts: ['flp01']
        },
        detectors: ['TST'],
        workflow: 'readout',
        revision: 'master',
        repository: 'git/repo.git',
      };
      const session = {username: 'someuser', personid: 11};
      req = {body, session};

      const apricotProxy = {
        ListRuntimeEntries: sinon.stub().rejects(new Error('Something went wrong'))
      };
      apricotService = new ApricotService(apricotProxy);

      await apricotService.saveConfiguration(req, res);
      assert.ok(res.status.calledWith(503));
      assert.ok(res.send.calledOnce);
      assert.ok(res.send.calledWith({message: 'Something went wrong'}));
    });


    it('should reply with error due to already existing configuration with the same name', async () => {
      const body = {
        name: 'MY_OWN',
        variables: {
          some_enabled: 'true',
          some_other: 'false',
          hosts: ['flp01']
        },
        detectors: ['TST'],
        workflow: 'readout',
        revision: 'master',
        repository: 'git/repo.git',
      };
      const session = {username: 'someuser', personid: 11};
      req = {body, session};

      const apricotProxy = {
        ListRuntimeEntries: sinon.stub().resolves({payload: ['MY_OWN']})
      };
      apricotService = new ApricotService(apricotProxy);

      await apricotService.saveConfiguration(req, res);
      assert.ok(res.status.calledWith(409));
      assert.ok(res.send.calledOnce);
      assert.ok(res.send.calledWith({message: `A configuration with name 'MY_OWN' already exists`}));
    });

    it('should reply with error due to Apricot SetRuntineEntry call failure', async () => {
      const body = {
        name: 'MY_OWN_TST',
        variables: {
          some_enabled: 'true',
          some_other: 'false',
          hosts: ['flp01']
        },
        detectors: ['TST'],
        workflow: 'readout',
        revision: 'master',
        repository: 'git/repo.git',
      };
      const session = {username: 'someuser', personid: 11};
      req = {body, session};

      const apricotProxy = {
        SetRuntimeEntry: sinon.stub().rejects(new Error('Cannot be saved')),
        ListRuntimeEntries: sinon.stub().resolves({payload: ['MY_OWN']})
      };
      apricotService = new ApricotService(apricotProxy);

      await apricotService.saveConfiguration(req, res);
      assert.ok(res.status.calledWith(503));
      assert.ok(res.send.calledOnce);
      assert.ok(res.send.calledWith({message: `Cannot be saved`}));
    });
  });

  describe('Check Helper methods', () => {
    let service;
    before(() => {
      service = new ApricotService({});
    });

    it('should throw error if name is missing', () => {
      assert.throws(() => service._getNameAsId(null), new TypeError(`Cannot read property 'trim' of null`));
      assert.throws(() => service._getNameAsId(undefined), new TypeError(`Cannot read property 'trim' of undefined`));
      assert.throws(() => service._getNameAsId(), new TypeError(`Cannot read property 'trim' of undefined`));
    });

    it('should succesfully trim and replace spaces and / characters from name and return formated id', () => {
      assert.strictEqual(service._getNameAsId('  test / test'), 'test___test');
      assert.strictEqual(service._getNameAsId('test/test'), 'test_test');
      assert.strictEqual(service._getNameAsId('  test  '), 'test');
      assert.strictEqual(service._getNameAsId('Detector test config '), 'Detector_test_config');
    });

    it('should succesfully build a configuration to store JSON based on request object', () => {
      const body = {
        name: 'My TST Configuration',
        variables: {
          some_enabled: 'true',
          some_other: 'false',
          hosts: ['flp01']
        },
        detectors: ['TST'],
        workflow: 'readout',
        revision: 'master',
        repository: 'git/repo.git',
      };
      const session = {username: 'someuser', personid: 11};
      const req = {body, session};
      const result = service._buildConfigurationObject(req);
      const expected = {
        key: 'My_TST_Configuration',
        value: {
          user: {username: 'someuser', personid: 11},
          variables: {
            some_enabled: 'true',
            some_other: 'false',
            hosts: ['flp01']
          },
          detectors: ['TST'],
          workflow: 'readout',
          revision: 'master',
          repository: 'git/repo.git',
          name: 'My TST Configuration',
          id: 'My_TST_Configuration',
        }
      };

      assert.ok(result.value.created, 'Field with creation timestamp was not added');
      delete result.value.created;
      assert.ok(result.value.edited, 'Field with edition timestamp was not added');
      delete result.value.edited;
      assert.deepStrictEqual(result, expected, 'Configuration objects was not build successfully')

    });

    it('should throw errors if mandatory fields are missing', () => {
      const body = {
        variables: {
          some_enabled: 'true',
          some_other: 'false',
          hosts: ['flp01']
        },
        detectors: ['TST'],
        workflow: 'readout',
        revision: 'master',
        repository: 'git/repo.git',
      };
      const session = {username: 'someuser', personid: 11};
      const req = {body, session};

      assert.throws(() => service._buildConfigurationObject(req),
        new Error(`Configuration cannot be saved without the following fields: name`));
    });

    it('should throw errors if mandatory fields are missing', () => {
      const body = {
        name: 'Some name',
        variables: {
          some_enabled: 'true',
          some_other: 'false',
          hosts: ['flp01']
        },
        detectors: ['TST'],
        repository: 'git/repo.git',
      };
      const session = {username: 'someuser', personid: 11};
      const req = {body, session};

      assert.throws(() => service._buildConfigurationObject(req),
        new Error(`Configuration cannot be saved without the following fields: workflow,revision`));
    });

    it('should throw errors if mandatory fields are missing', () => {
      const body = {
        name: 'Some name',
        variables: {
          some_enabled: 'true',
          some_other: 'false',
          hosts: ['flp01']
        },
        workflow: 'readout',
        revision: 'master',
      };
      const session = {username: 'someuser', personid: 11};
      const req = {body, session};

      assert.throws(() => service._buildConfigurationObject(req),
        new Error(`Configuration cannot be saved without the following fields: repository`));
    });
  });
});
