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
    QcObjectServiceMock = {
      retrieveLatestVersionOfObjects: sinon.stub(),
      retrieveQcObject: sinon.stub(),
      retrieveQcObjectByQcgId: sinon.stub(),
    };
    RunMonitoringServiceMock = {
      checkAndSetRunMonitoring: sinon.spy(),
      retrievePathsAndSetRunStatus: sinon.stub(),
    };
    objectController = new ObjectController(QcObjectServiceMock, RunMonitoringServiceMock);
  });

  afterEach(() => {
    sinon.restore();
  });

  suite('getObjects() tests', () => {
    const mockObjectsList = [
      { objectName: 'object1', path: 'qc/path/object1' },
      { objectName: 'object2', path: 'qc/path/object2' },
    ];

    test('should return an invalid input error if no run number is provided in run mode', async () => {
      reqMock.query.inRunMode = true;
      reqMock.query.filters = {};
      await objectController.getObjects(reqMock, resMock);
      ok(resMock.status.calledWith(400));
      ok(resMock.json.calledWithMatch({
        message: 'RunNumber is required when in run mode',
        status: 400,
        title: 'Invalid Input',
      }));
    });

    test('should retrieve paths and set run status in run mode with run number', async () => {
      reqMock.query.inRunMode = true;
      reqMock.query.filters = { RunNumber: 123 };
      RunMonitoringServiceMock.retrievePathsAndSetRunStatus.resolves({
        paths: mockObjectsList,
        runStatus: 'ONGOING',
      });

      await objectController.getObjects(reqMock, resMock);

      ok(RunMonitoringServiceMock.retrievePathsAndSetRunStatus.calledWith(123, undefined));
      ok(resMock.status.calledWith(200));
      ok(resMock.json.calledWith({
        paths: mockObjectsList,
        runStatus: 'ONGOING',
      }));
    });

    test('should retrieve latest version of objects when not in run mode', async () => {
      reqMock.query = {
        prefix: 'qc/path',
        fields: 'objectName,path',
        filters: { RunNumber: 123 },
      };
      QcObjectServiceMock.retrieveLatestVersionOfObjects.resolves(mockObjectsList);
      await objectController.getObjects(reqMock, resMock);
      ok(resMock.status.calledWith(200));
      ok(resMock.json.calledWith(mockObjectsList));
      ok(QcObjectServiceMock.retrieveLatestVersionOfObjects.calledWith({
        prefix: reqMock.query.prefix,
        fields: reqMock.query.fields,
        filters: reqMock.query.filters,
      }));
    });

    test('should throw error when retrieving objects fails', async () => {
      QcObjectServiceMock.retrieveLatestVersionOfObjects.rejects(new Error('Service error'));
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
      QcObjectServiceMock.retrieveQcObject.resolves(stubObject);
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
      QcObjectServiceMock.retrieveQcObject.rejects(new Error('Service error'));
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
      QcObjectServiceMock.retrieveQcObjectByQcgId.resolves(mockObject);
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
      QcObjectServiceMock.retrieveQcObjectByQcgId.rejects(new Error('Service error'));
      await objectController.getObjectById(reqMock, resMock);

      ok(resMock.status.calledWith(500));
      ok(resMock.json.calledWithMatch({
        message: 'Unable to identify object or read it by qcg id',
        status: 500,
        title: 'Unknown Error',
      }));
    });
  });
};
