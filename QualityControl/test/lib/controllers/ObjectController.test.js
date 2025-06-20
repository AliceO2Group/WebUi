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

import test, { afterEach, beforeEach, suite } from 'node:test';
import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import sinon from 'sinon';
import { ObjectController } from '../../../lib/controllers/ObjectController.js';
import { QcObjectService } from '../../../lib/services/QcObject.service.js';
import { NotFoundError } from '@aliceo2/web-ui';
import { RunStatus } from '../../../common/library/runStatus.enum.js';

export const objectControllerTestSuite = async () => {
  let QcObjectServiceMock = null;
  let reqMock = null;
  let resMock = null;
  let objectController = null;

  beforeEach(() => {
    resMock = {
      status: sinon.stub().returnsThis(),
      send: sinon.spy(),
      json: sinon.spy(),
    };
    reqMock = {
      query: { token: 'someToken' },
      params: {},
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  suite('getObjects() tests', () => {
    const mockObjectsList = [
      { objectName: 'object1', path: 'qc/path/object1' },
      { objectName: 'object2', path: 'qc/path/object2' },
    ];

    test('should successfully retrieve objects list without prefix', async () => {
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockObjectsList),
      });

      objectController = new ObjectController(QcObjectServiceMock);
      await objectController.getObjects(reqMock, resMock);

      ok(resMock.status.calledWith(200));
      ok(resMock.json.calledWith(mockObjectsList));

      ok(QcObjectServiceMock.retrieveLatestVersionOfObjects.calledWith({
        prefix: undefined, fields: undefined, filters: undefined }));
    });

    test('should successfully retrieve objects list with prefix and fields', async () => {
      reqMock.query.prefix = 'qc/path';
      reqMock.query.fields = ['objectName', 'path'];

      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockObjectsList),
      });

      objectController = new ObjectController(QcObjectServiceMock);
      await objectController.getObjects(reqMock, resMock);

      ok(resMock.status.calledWith(200));
      ok(QcObjectServiceMock.retrieveLatestVersionOfObjects
        .calledWith({ prefix: 'qc/path', fields: ['objectName', 'path'], filters: undefined }));
    });

    test('should handle service errors when retrieving objects', async () => {
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        retrieveLatestVersionOfObjects: sinon.stub().rejects(new NotFoundError('Object not found')),
      });

      objectController = new ObjectController(QcObjectServiceMock);
      await objectController.getObjects(reqMock, resMock);

      ok(resMock.status.calledWith(500));
      ok(resMock.json.calledWithMatch({
        message: 'Failed to retrieve list of objects latest version',
        status: 500,
        title: 'Unknown Error',
      }));
    });
  });

  suite('getObjectContent() tests', () => {
    const stubObject = {
      path: 'qc/path',
      versions: [
        {
          validFrom: 1736424299423,
          id: '4f9917a2-ce82-11ef-936c-c0a80209250c',
          createdAt: 1736424454827,
        },
        {
          validFrom: 1736420279131,
          id: '21a6de32-ce79-11ef-936b-c0a80209250c',
          createdAt: 1736420512272,
        },
      ],
    };

    test('should successfully retrieve object content', async () => {
      reqMock.query.path = stubObject.path;
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        retrieveQcObject: sinon.stub().resolves(stubObject),
      });

      objectController = new ObjectController(QcObjectServiceMock);
      await objectController.getObjectContent(reqMock, resMock);

      ok(resMock.status.calledWith(200));
      ok(resMock.json.calledWith(stubObject));
      ok(QcObjectServiceMock.retrieveQcObject.calledWith({
        path: stubObject.path,
        validFrom: undefined,
        filters: undefined,
        id: undefined,
      }));
    });

    test('should handle service errors when retrieving object content', async () => {
      reqMock.query.path = 'qc/test';
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        retrieveQcObject: sinon.stub().rejects(new NotFoundError('Object not found')),
      });

      objectController = new ObjectController(QcObjectServiceMock);
      await objectController.getObjectContent(reqMock, resMock);

      ok(resMock.status.calledWith(500));
      ok(resMock.json.calledWithMatch({
        message: 'Failed to retrieve object content',
        status: 500,
        title: 'Unknown Error',
      }));
    });
  });

  suite('getObjectById() tests', () => {
    const mockObject = {
      id: '21a6de32-ce79-11ef-936b-c0a80209250c',
      path: 'qc/path/object',
      validFrom: 1736420279131,
    };

    test('should successfully retrieve object by QCG ID', async () => {
      reqMock.params.id = mockObject.id;
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        retrieveQcObjectByQcgId: sinon.stub().resolves(mockObject),
      });

      objectController = new ObjectController(QcObjectServiceMock);
      await objectController.getObjectById(reqMock, resMock);

      ok(resMock.status.calledWith(200));
      ok(resMock.json.calledWith(mockObject));
      ok(QcObjectServiceMock.retrieveQcObjectByQcgId.calledWith({
        validFrom: undefined,
        filters: undefined,
        id: undefined,
        qcObjectId: mockObject.id,
      }));
    });

    test('should handle service errors when retrieving object by ID', async () => {
      reqMock.params.id = 'some-id';
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        retrieveQcObjectByQcgId: sinon.stub().rejects(new NotFoundError('Object not found')),
      });

      objectController = new ObjectController(QcObjectServiceMock);
      await objectController.getObjectById(reqMock, resMock);

      ok(resMock.status.calledWith(500));
      ok(resMock.json.calledWithMatch({
        message: 'Unable to identify object or read it by qcg id',
        status: 500,
        title: 'Unknown Error',
      }));
      ok(QcObjectServiceMock.retrieveQcObjectByQcgId.calledWith({
        validFrom: undefined,
        filters: undefined,
        id: undefined,
        qcObjectId: 'some-id',
      }));
    });
  });

  suite('Interval Checkup Tests', () => {
    let FilterServiceMock = undefined;
    let IntervalsServiceMock = undefined;
    const mockRunNumber = 123456;
    const mockQueryKey = JSON.stringify({ filters: { RunNumber: mockRunNumber } });
    const mockData = [{ path: 'somePath' }];

    beforeEach(() => {
      FilterServiceMock = {
        getRunStatus: sinon.stub(),
      };
      IntervalsServiceMock = {
        activeInterval: sinon.stub(),
        register: sinon.spy(),
        deregister: sinon.spy(),
      };
    });

    test('should setup monitoring for active run when not cached', async () => {
      reqMock.query.filters = { RunNumber: mockRunNumber };
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        getRunCache: sinon.stub().returns(undefined),
        setRunCache: sinon.spy(),
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockData),
      });
      FilterServiceMock.getRunStatus.withArgs(mockRunNumber).resolves(RunStatus.ACTIVE);
      IntervalsServiceMock.activeInterval.returns(false);

      objectController = new ObjectController(QcObjectServiceMock, FilterServiceMock, IntervalsServiceMock);
      await objectController.getObjects(reqMock, resMock);

      console.log(resMock.status.args);
      console.log(resMock.json.args);
      
      ok(resMock.status.calledWith(200));
      ok(resMock.json.calledWith(mockData));
      ok(IntervalsServiceMock.register.calledOnce);

      const [[intervalKey, cacheData]] = QcObjectServiceMock.setRunCache.args;
      const correctTimestamp = Date.now() - cacheData.timestamp < 100;

      strictEqual(intervalKey, mockQueryKey);
      deepStrictEqual(cacheData.data, mockData);

      ok(correctTimestamp, 'The timestamp for the cache is incorrect.');
    });

    test('should not setup monitoring if run is not active', async () => {
      reqMock.query.filters = { RunNumber: mockRunNumber };
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        getRunCache: sinon.stub().returns(null),
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockData),
      });
      FilterServiceMock.getRunStatus.withArgs(mockRunNumber).resolves(RunStatus.COMPLETED);

      objectController = new ObjectController(QcObjectServiceMock, FilterServiceMock, IntervalsServiceMock);
      await objectController.getObjects(reqMock, resMock);

      ok(resMock.status.calledWith(200));
      ok(IntervalsServiceMock.register.notCalled);
    });

    test('should use cached data if available and not setup monitoring', async () => {
      reqMock.query.filters = { RunNumber: mockRunNumber };
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        getRunCache: sinon.stub().returns(mockData),
      });

      objectController = new ObjectController(QcObjectServiceMock, FilterServiceMock, IntervalsServiceMock);
      await objectController.getObjects(reqMock, resMock);

      ok(resMock.status.calledWith(200));
      ok(resMock.json.calledWith(mockData.data));
      ok(FilterServiceMock.getRunStatus.notCalled);
      ok(IntervalsServiceMock.register.notCalled);
    });

    test('should stop monitoring in interval callback when run status changes from active', async () => {
      reqMock.query.filters = { RunNumber: mockRunNumber };
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        getRunCache: sinon.stub().returns(null),
        setRunCache: sinon.spy(),
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockData),
      });
      FilterServiceMock.getRunStatus.onFirstCall().resolves(RunStatus.ACTIVE);
      IntervalsServiceMock.activeInterval.returns(false);

      objectController = new ObjectController(QcObjectServiceMock, FilterServiceMock, IntervalsServiceMock);
      await objectController.getObjects(reqMock, resMock);

      // Simulate interval callback with run status changed to completed
      FilterServiceMock.getRunStatus.reset();
      FilterServiceMock.getRunStatus.resolves(RunStatus.COMPLETED);
      await objectController._updateAndCheckStatus(
        mockQueryKey,
        reqMock.query,
        QcObjectServiceMock.retrieveLatestVersionOfObjects,
      );

      ok(IntervalsServiceMock.deregister.calledWith(mockQueryKey));
      ok(QcObjectServiceMock.removeRunCache.calledWith(mockQueryKey));
    });

    test('should continue monitoring in interval callback if run is still active', async () => {
      // First call - active run
      reqMock.query.filters = { RunNumber: mockRunNumber };
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        getRunCache: sinon.stub().returns(null),
        setRunCache: sinon.spy(),
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockData),
      });
      FilterServiceMock.getRunStatus.resolves(RunStatus.ACTIVE);
      IntervalsServiceMock.activeInterval.returns(false);

      objectController = new ObjectController(QcObjectServiceMock, FilterServiceMock, IntervalsServiceMock);
      await objectController.getObjects(reqMock, resMock);

      // Simulate interval callback with run still active
      await objectController._updateAndCheckStatus(
        mockQueryKey,
        reqMock.query,
        QcObjectServiceMock.retrieveLatestVersionOfObjects,
      );

      ok(IntervalsServiceMock.deregister.notCalled);
      ok(QcObjectServiceMock.removeRunCache.notCalled);
      ok(QcObjectServiceMock.setRunCache.calledTwice);
    });

    test('should handle errors during interval checkup', async () => {
      reqMock.query.filters = { RunNumber: mockRunNumber };
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        getRunCache: sinon.stub().returns(null),
        setRunCache: sinon.spy(),
        retrieveLatestVersionOfObjects: sinon.stub().rejects(new Error('Test error')),
      });
      FilterServiceMock.getRunStatus.resolves(RunStatus.ACTIVE);
      IntervalsServiceMock.activeInterval.returns(false);

      objectController = new ObjectController(QcObjectServiceMock, FilterServiceMock, IntervalsServiceMock);
      await objectController.getObjects(reqMock, resMock);

      // Simulate interval callback with error
      await objectController._updateAndCheckStatus(
        mockQueryKey,
        reqMock.query,
        QcObjectServiceMock.retrieveLatestVersionOfObjects,
      );

      // Should continue monitoring despite the error
      ok(IntervalsServiceMock.deregister.notCalled);
    });

    test('should not setup duplicate monitoring for same query', async () => {
      reqMock.query.filters = { RunNumber: mockRunNumber };
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        getRunCache: sinon.stub().returns(null),
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockData),
      });
      FilterServiceMock.getRunStatus.resolves(RunStatus.ACTIVE);
      IntervalsServiceMock.activeInterval.returns(true); // Simulate existing interval

      objectController = new ObjectController(QcObjectServiceMock, FilterServiceMock, IntervalsServiceMock);
      await objectController.getObjects(reqMock, resMock);

      ok(IntervalsServiceMock.register.notCalled);
    });

    test('should handle requests without RunNumber in filters', async () => {
      reqMock.query = {};

      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockData),
        getRunCache: sinon.stub().returns(undefined),
      });

      objectController = new ObjectController(QcObjectServiceMock);
      await objectController.getObjects(reqMock, resMock);

      ok(resMock.status.calledWith(200));
      ok(resMock.json.calledWith(mockData));
      ok(QcObjectServiceMock.retrieveLatestVersionOfObjects.calledWith({
        prefix: undefined, fields: undefined, filters: undefined,
      }));
      ok(FilterServiceMock.getRunStatus.notCalled);
      ok(IntervalsServiceMock.register.notCalled);
    });
  });
};
