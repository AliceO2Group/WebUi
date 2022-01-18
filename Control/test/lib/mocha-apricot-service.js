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
const assert = require('assert');
const AssertionError = require('assert').AssertionError;

const ApricotService = require('./../../lib/control-core/ApricotService.js');

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

  describe('Check Status of Apricot', () => {
    it('should successfully return promise resolved if list detectors returns', async () => {
      const apricotProxy = {
        isConnectionReady: true,
        ListDetectors: sinon.stub().resolves({detectors: ['TST']})
      };
      const apricotService = new ApricotService(apricotProxy);
      assert.doesNotReject(async () => apricotService.getStatus());
    });

    it('should return status error if apricotProxy is not ready', async () => {
      const apricotProxy = {isConnectionReady: false};
      const apricotService = new ApricotService(apricotProxy);
      assert.rejects(() => apricotService.getStatus(), new Error('Unable to check status of Apricot'));
    });

    it('should return status error if apricotProxy fails to return list of detectors', async () => {
      const apricotProxy = {
        isConnectionReady: true,
        ListDetectors: sinon.stub().rejects('Apricot is not working')
      };
      const apricotService = new ApricotService(apricotProxy);
      assert.rejects(() => apricotService.getStatus(), new Error('Apricot is not working'));
    });
  });

  describe('Check in-memory detectorlist', () => {
    let req, res;
    beforeEach(() => {
      req = {};
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
        send: sinon.spy(),
      };
    });
    it('should successfully request a list of detectors from AliECS core if none are present', async () => {
      const apricotProxy = {
        isConnectionReady: true,
        ListDetectors: sinon.stub().resolves({detectors: ['TST']})
      };
      const apricotService = new ApricotService(apricotProxy);
      await apricotService.getDetectorList(req, res);
      assert.ok(res.status.calledOnce);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledOnce);
      assert.ok(res.json.calledWith({detectors: ['TST']}));
    });

    it('should successfully return a list of detectors if already present', async () => {
      const apricotService = new ApricotService({});
      apricotService.detectors = ['TST'];
      await apricotService.getDetectorList(req, res);
      assert.ok(res.status.calledOnce);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledOnce);
      assert.ok(res.json.calledWith({detectors: ['TST']}));
    });

    it('should return error response if detectors are not present and AliECS replies with error', async () => {
      const apricotProxy = {
        isConnectionReady: true,
        ListDetectors: sinon.stub().rejects(new Error('Unable to retrieve list'))
      };
      const apricotService = new ApricotService(apricotProxy);
      await apricotService.getDetectorList(req, res);
      assert.ok(res.status.calledOnce);
      assert.ok(res.status.calledWith(503));
      assert.ok(res.send.calledOnce);
      assert.ok(res.send.calledWith({message: 'Unable to retrieve list'}));
    });
  });

  describe('Check detectors caching', () => {
    let req, res;

    beforeEach(() => {
      req = {};
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
        send: sinon.spy(),
      };
    });

    it('should successfully request hosts for each detector from AliECS core if none are present', async () => {
      const apricotProxy = {
        isConnectionReady: true,
        ListDetectors: sinon.stub().resolves({detectors: ['TST']}),
        GetHostInventory: sinon.stub().resolves({hosts: ['flp001']}),
      };
      const apricotService = new ApricotService(apricotProxy);
      await apricotService.getHostsByDetectorList(req, res);
      assert.ok(res.status.calledOnce);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledOnce);
      assert.ok(res.json.calledWith({hosts: {TST: ['flp001']}}));
    });

    it('should successfully return a map of hosts grouped by detectors if already present', async () => {
      const apricotService = new ApricotService({});
      apricotService.hostsByDetector = new Map([['TST', ['flp001']]]);
      await apricotService.getHostsByDetectorList(req, res);
      assert.ok(res.status.calledOnce);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledOnce);
      assert.ok(res.json.calledWith({hosts: {TST: ['flp001']}}));
    });

    it('should return error response if hostsByDetectors are not present and AliECS replies with error for initial detector request', async () => {
      const apricotProxy = {
        isConnectionReady: true,
        ListDetectors: sinon.stub().rejects(new Error('unable to load detector list')),
      };
      const apricotService = new ApricotService(apricotProxy);
      await apricotService.getHostsByDetectorList(req, res);
      assert.ok(res.status.calledOnce);
      assert.ok(res.status.calledWith(503));
      assert.ok(res.send.calledOnce);
      assert.ok(res.send.calledWith({message: 'unable to load detector list'}));
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
      assert.ok(res.send.calledWith({message: 'Could not establish connection to O2Apricot due to potentially undefined method'}));
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
      assert.ok(res.send.calledWith({message: 'Could not establish connection to O2Apricot due to potentially undefined method'}));
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
      const session = {username: 'user', personid: 11};
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
      const session = {username: 'user', personid: 11};
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

    it('should reply with error due to Apricot ListRuntimeEntries call failure', async () => {
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
      const session = {username: 'user', personid: 11};
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
      const session = {username: 'user', personid: 11};
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

    it('should reply with error due to Apricot SetRuntimeEntry call failure', async () => {
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
      const session = {username: 'user', personid: 11};
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
      assert.throws(() => service._getNameAsId(null), new TypeError(`Cannot read properties of null (reading 'trim')`));
      assert.throws(() => service._getNameAsId(undefined), new TypeError(`Cannot read properties of undefined (reading 'trim')`));
      assert.throws(() => service._getNameAsId(), new TypeError(`Cannot read properties of undefined (reading 'trim')`));
    });

    it('should successfully trim and replace spaces and / characters from name and return format id', () => {
      assert.strictEqual(service._getNameAsId('  test / test'), 'test___test');
      assert.strictEqual(service._getNameAsId('test/test'), 'test_test');
      assert.strictEqual(service._getNameAsId('  test  '), 'test');
      assert.strictEqual(service._getNameAsId('Detector test config '), 'Detector_test_config');
    });

    it('should successfully build a configuration to store JSON based on request object', () => {
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
      const session = {username: 'user', personid: 11};
      const req = {body, session};
      const result = service._buildConfigurationObject(req);
      const expected = {
        key: 'My_TST_Configuration',
        value: {
          user: {username: 'user', personid: 11},
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
      const session = {username: 'user', personid: 11};
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
      const session = {username: 'user', personid: 11};
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
      const session = {username: 'user', personid: 11};
      const req = {body, session};

      assert.throws(() => service._buildConfigurationObject(req),
        new Error(`Configuration cannot be saved without the following fields: repository`));
    });
  });
});
