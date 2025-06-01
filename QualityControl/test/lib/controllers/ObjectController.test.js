import test, { afterEach, beforeEach, suite } from 'node:test';
import { ok } from 'node:assert';
import sinon from 'sinon';
import { ObjectController } from '../../../lib/controllers/ObjectController.js';
import { QcObjectService } from '../../../lib/services/QcObject.service.js';
import { RUN_TYPES } from '../../../lib/dtos/ObjectGetDto.js';

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
    reqMock = { query: { token: 'someToken' } };
  });

  afterEach(() => {
    sinon.restore();
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

    test('should send generic error if QcObjectService fails.', async () => {
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        retrieveQcObject: sinon.stub().rejects(new Error('Failed to load data for object')),
      });

      objectController = new ObjectController(QcObjectServiceMock);
      reqMock.query.path = 'qc/test';
      await objectController.getObjectContent(reqMock, resMock);

      ok(resMock.status.calledWith(500), 'Response status was not 500');
      ok(resMock.json.calledWith({
        message: 'Failed to retrieve object content',
        status: 500,
        title: 'Unknown Error',
      }));
    });

    test('should send error if path is not defined.', async () => {
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        retrieveQcObject: sinon.stub().rejects(new Error('Failed to load data for object')),
      });
      reqMock.query.path = 1; // not a string

      objectController = new ObjectController(QcObjectServiceMock);
      await objectController.getObjectContent(reqMock, resMock);
      ok(resMock.status.calledWith(400), 'Response status was not 400');
      ok(resMock.json.calledWith({
        message: 'Invalid query parameters: "path" must be a string',
        status: 400,
        title: 'Invalid Input',
      }));
    });

    test('should successfully send object down.', async () => {
      reqMock.query.path = stubObject.path;
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        retrieveQcObject: sinon.stub().resolves(stubObject),
      });

      objectController = new ObjectController(QcObjectServiceMock);
      await objectController.getObjectContent(reqMock, resMock);
      ok(resMock.status.calledWith(200));
      ok(resMock.json.calledWith(stubObject));
    });
  });

  suite('getObjects() tests', () => {
    const mockList = [
      { path: 'qc/test', validFrom: 123456, name: 'qc/test' },
      { path: 'qc/test2', validFrom: 789012, name: 'qc/test2' },
    ];

    beforeEach(() => {
      reqMock.query.prefix = 'qc/test';
    });

    test('should send an error if prefix is not a string', async () => {
      objectController = new ObjectController({});
      reqMock.query.prefix = ['qc/test'];
      await objectController.getObjects(reqMock, resMock);
      ok(resMock.status.calledWith(400), 'Response status was not 400');
      ok(
        resMock.json.calledWith({
          message: 'Invalid query parameters: "prefix" must be a string',
          status: 400,
          title: 'Invalid Input',
        }),
        'Error message was incorrect.',
      );
    });

    test('should send error if fields is not an array', async () => {
      objectController = new ObjectController({});
      reqMock.query.fields = 'not-an-array';
      await objectController.getObjects(reqMock, resMock);
      ok(resMock.status.calledWith(400), 'Response status was not 400');
      ok(
        resMock.json.calledWith({
          message: 'Invalid query parameters: "fields" must be an array',
          status: 400,
          title: 'Invalid Input',
        }),
        'Error message was incorrect.',
      );
    });

    test('should send generic error if service fails to retrieve objects', async () => {
      const objService = {
        retrieveLatestVersionOfObjects: sinon.stub().rejects(new Error('Failed to retrieve objects')),
      };
      objectController = new ObjectController(objService);
      reqMock.query.fields = [];
      await objectController.getObjects(reqMock, resMock);
      ok(resMock.status.calledWith(500), 'Response status was not 500');
      ok(
        resMock.json.calledWith({
          message: 'Failed to retrieve list of objects latest version',
          status: 500,
          title: 'Unknown Error',
        }),
        'Error message was incorrect.',
      );
    });

    test('should send error if invalid filter field is provided', async () => {
      const objService = {
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockList),
      };
      objectController = new ObjectController(objService);
      reqMock.query.fields = [];
      reqMock.query.filters = { incorrect_filter: 100 };

      await objectController.getObjects(reqMock, resMock);

      ok(resMock.status.calledWith(400), 'Response status was not 400');
      ok(
        resMock.json.calledWith({
          message: 'Invalid query parameters: Unknown filter field: incorrect_filter',
          status: 400,
          title: 'Invalid Input',
        }),
        'Error message was incorrect.',
      );
    });

    test('should send error if RunNumber filter exeeds 1000000', async () => {
      const objService = {
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockList),
      };
      objectController = new ObjectController(objService);
      reqMock.query.fields = [];
      reqMock.query.filters = { RunNumber: 1000001 };

      await objectController.getObjects(reqMock, resMock);

      ok(resMock.status.calledWith(400), 'Response status was not 400');
      ok(
        resMock.json.calledWith({
          message: 'Invalid query parameters: RunNumber must be a number between 0 and 999999',
          status: 400,
          title: 'Invalid Input',
        }),
        'Error message was incorrect.',
      );
    });

    test('should send error if RunNumber filter is negative', async () => {
      const objService = {
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockList),
      };
      objectController = new ObjectController(objService);
      reqMock.query.fields = [];
      reqMock.query.filters = { RunNumber: -1 };

      await objectController.getObjects(reqMock, resMock);

      ok(resMock.status.calledWith(400), 'Response status was not 400');
      ok(
        resMock.json.calledWithMatch({
          message: 'Invalid query parameters: RunNumber must be a number between 0 and 999999',
        }),
        'Error message was incorrect.',
      );
    });

    test('should accept valid RunNumber filter', async () => {
      const objService = {
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockList),
      };
      objectController = new ObjectController(objService);
      reqMock.query.fields = [];
      reqMock.query.filters = { RunNumber: 123456 };

      await objectController.getObjects(reqMock, resMock);

      ok(resMock.status.calledWith(200), 'Response status was not 200');
      ok(objService.retrieveLatestVersionOfObjects.calledOnce, 'Service method not called');
    });

    test('should send error if RunType filter is invalid', async () => {
      const objService = {
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockList),
      };
      objectController = new ObjectController(objService);
      reqMock.query.fields = [];
      reqMock.query.filters = { RunType: 'INVALID_TYPE' };

      await objectController.getObjects(reqMock, resMock);

      ok(resMock.status.calledWith(400), 'Response status was not 400');
      ok(
        resMock.json.calledWithMatch({
          message: `Invalid query parameters: RunType must be one of: ${RUN_TYPES.join(', ')}`,
        }),
        'Error message was incorrect.',
      );
    });

    test('should send error if PeriodName filter is invalid', async () => {
      const objService = {
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockList),
      };
      objectController = new ObjectController(objService);
      reqMock.query.fields = [];
      reqMock.query.filters = { PeriodName: 'INVALID_PERIOD' };

      await objectController.getObjects(reqMock, resMock);

      ok(resMock.status.calledWith(400), 'Response status was not 400');
      ok(
        resMock.json.calledWithMatch({
          message: 'Invalid query parameters: PeriodName must match pattern LHC followed by 1-2 digits and letters',
        }),
        'Error message was incorrect.',
      );
    });

    test('should successfully respond with list of objects', async () => {
      const objService = {
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockList),
      };

      objectController = new ObjectController(objService);
      reqMock.query.fields = ['path', 'validFrom'];
      await objectController.getObjects(reqMock, resMock);

      ok(resMock.status.calledWith(200), 'Response status was not 200');
      ok(resMock.json.calledWith(mockList), 'Response list was incorrect');
    });
  });
};
