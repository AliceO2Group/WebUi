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
import { ok } from 'node:assert';
import sinon from 'sinon';
import { ObjectController } from '../../../lib/controllers/ObjectController.js';
import { QcObjectService } from '../../../lib/services/QcObject.service.js';
import { NotFoundError } from '@aliceo2/web-ui';

export const objectControllerTestSuite = async () => {
  let QcObjectServiceMock = null;
  let reqMock = null;
  let resMock = null;
  let objectController = null;
  let RunMonitoringServiceMock = null;

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
    RunMonitoringServiceMock = {
      checkAndSetRunMonitoring: sinon.spy(),
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

      objectController = new ObjectController(QcObjectServiceMock, RunMonitoringServiceMock);
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

      objectController = new ObjectController(QcObjectServiceMock, RunMonitoringServiceMock);
      await objectController.getObjects(reqMock, resMock);

      ok(resMock.status.calledWith(200));
      ok(QcObjectServiceMock.retrieveLatestVersionOfObjects
        .calledWith({ prefix: 'qc/path', fields: ['objectName', 'path'], filters: undefined }));
    });

    test('should handle service errors when retrieving objects', async () => {
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        retrieveLatestVersionOfObjects: sinon.stub().rejects(new NotFoundError('Object not found')),
      });

      objectController = new ObjectController(QcObjectServiceMock, RunMonitoringServiceMock);
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

      objectController = new ObjectController(QcObjectServiceMock, RunMonitoringServiceMock);
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

      objectController = new ObjectController(QcObjectServiceMock, RunMonitoringServiceMock);
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

      objectController = new ObjectController(QcObjectServiceMock, RunMonitoringServiceMock);
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

      objectController = new ObjectController(QcObjectServiceMock, RunMonitoringServiceMock);
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
    suite('handleDataRetrieval() tests', () => {
      const callbackParams = { filters: { RunNumber: 123 } };
      const mockQueryKey = JSON.stringify(callbackParams);
      const cachedResponse = { data: [{ some: 'cachedData' }] };
      const newData = [{ some: 'newData' }];

      test('should return cached data if available', async () => {
        QcObjectServiceMock = {
          getRunCache: sinon.stub().withArgs(mockQueryKey).returns(cachedResponse),
        };
        RunMonitoringServiceMock = {
          checkAndSetRunMonitoring: sinon.spy(),
        };

        resMock = {
          status: sinon.stub().returnsThis(),
          json: sinon.spy(),
        };

        objectController = new ObjectController(QcObjectServiceMock, RunMonitoringServiceMock);
        await objectController._handleDataRetrieval(callbackParams, sinon.stub(), resMock, 'Custom error');

        ok(resMock.status.calledWith(200));
        ok(resMock.json.calledWith(cachedResponse.data));
        ok(RunMonitoringServiceMock.checkAndSetRunMonitoring.notCalled);
      });

      test('should call callback and checkAndSetRunMonitoring if no cached data', async () => {
        const callbackStub = sinon.stub().resolves(newData);

        QcObjectServiceMock = {
          getRunCache: sinon.stub().withArgs(mockQueryKey).returns(undefined),
        };
        RunMonitoringServiceMock = {
          checkAndSetRunMonitoring: sinon.spy(),
        };

        resMock = {
          status: sinon.stub().returnsThis(),
          json: sinon.spy(),
        };

        objectController = new ObjectController(QcObjectServiceMock, RunMonitoringServiceMock);
        await objectController._handleDataRetrieval(callbackParams, callbackStub, resMock, 'Custom error');

        ok(callbackStub.calledWith(callbackParams));
        ok(RunMonitoringServiceMock.checkAndSetRunMonitoring.calledWith(mockQueryKey, callbackParams, callbackStub));
        ok(resMock.status.calledWith(200));
        ok(resMock.json.calledWith(newData));
      });
      test('should handle errors during data retrieval and return 500', async () => {
        const callbackParams = { filters: { RunNumber: 123 } };
        const errorMessage = 'Failed to retrieve data';

        const callbackStub = sinon.stub().rejects(new Error('Some internal error'));

        QcObjectServiceMock = {
          getRunCache: sinon.stub().returns(undefined),
        };

        RunMonitoringServiceMock = {
          checkAndSetRunMonitoring: sinon.spy(),
        };
        resMock = {
          status: sinon.stub().returnsThis(),
          json: sinon.spy(),
        };
        objectController = new ObjectController(QcObjectServiceMock, RunMonitoringServiceMock);
        await objectController._handleDataRetrieval(callbackParams, callbackStub, resMock, errorMessage);

        ok(resMock.status.calledWith(500));
        ok(resMock.json.calledWithMatch({
          message: errorMessage,
          status: 500,
          title: 'Unknown Error',
        }));
      });
    });
  });
};
