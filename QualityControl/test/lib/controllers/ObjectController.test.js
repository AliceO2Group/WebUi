import test, { afterEach, beforeEach, suite } from 'node:test';
import { ok, strictEqual } from 'node:assert';
import sinon from 'sinon';
import { ObjectController } from '../../../lib/controllers/ObjectController.js';
import { QcObjectService } from '../../../lib/services/QcObject.service.js';

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
  });

  afterEach(() => {
    sinon.restore();
  });

  suite('getObjectContent() tests', () => {
    beforeEach(() => {
      reqMock = { query: {} };
    });

    test('should send generic error if QcObjectService fails.', async () => {
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        retrieveQcObject: sinon.stub().rejects(new Error('Failed to load data for object')),
      });

      objectController = new ObjectController(QcObjectServiceMock);
      reqMock.query.path = 'somePath';
      await objectController.getObjectContent(reqMock, resMock);
      checkGenericError(resMock);
    });

    test('should send error if path is not defined.', async () => {
      QcObjectServiceMock = sinon.createStubInstance(QcObjectService, {
        retrieveQcObject: sinon.stub().rejects(new Error('Failed to load data for object')),
      });
      reqMock.query.path = 1; // not a string

      objectController = new ObjectController(QcObjectServiceMock);
      await objectController.getObjectContent(reqMock, resMock);
      ok(resMock.status.calledWith(400), 'Response status was not 400');
      ok(resMock.json.calledWith({ message: 'Invalid URL parameters: missing object path' }));
    });

    test('should successfully send object down.', async () => {
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
    beforeEach(() => {
      reqMock = { query: {} };
    });

    test('should send generic error if prefix is not a string', async () => {
      objectController = new ObjectController({});
      reqMock.query.prefix = 123;
      await objectController.getObjects(reqMock, resMock);
      ok(resMock.status.calledWith(400), 'Response status was not 400');
      ok(
        resMock.json.calledWith({ message: 'Invalid parameters provided: prefix must be of type string' }),
        'Error message was incorrect.',
      );
    });

    test('should send error if fields is not an array', async () => {
      objectController = new ObjectController({});
      reqMock.query.fields = 'not-an-array';
      await objectController.getObjects(reqMock, resMock);
      ok(resMock.status.calledWith(400), 'Response status was not 400');
      ok(
        resMock.json.calledWith({ message: 'Invalid parameters provided: fields must be of type Array' }),
        'Error message was incorrect.',
      );
    });

    test('should send generic error if service fails to retrieve objects', async () => {
      const objService = {
        runNumber: null,
        retrieveLatestVersionOfObjects: sinon.stub().rejects(new Error('Failed to retrieve objects')),
      };
      objectController = new ObjectController(objService);
      reqMock.query.fields = [];
      await objectController.getObjects(reqMock, resMock);
      ok(resMock.status.calledWith(502), 'Response status was not 502');
      ok(
        resMock.send.calledWith({ message: 'Failed to retrieve list of objects latest version' }),
        'Error message was incorrect.',
      );
    });

    test('should successfully respond with list of objects', async () => {
      const mockList = [{ path: 'qc/test', validFrom: 123456 }];
      const objService = {
        _runNumber: undefined,
        setRunNumber: function (RunNumber) {
          this._runNumber = RunNumber;
        },
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockList),
      };

      objectController = new ObjectController(objService);
      reqMock.query.fields = ['path', 'validFrom'];
      await objectController.getObjects(reqMock, resMock);
      ok(resMock.status.calledWith(200), 'Response status was not 200');
      ok(resMock.json.calledWith(mockList), 'Response list was incorrect');
    });

    test('should set runNumber on service if provided', async () => {
      const mockList = [];
      const objService = {
        _runNumber: undefined,
        setRunNumber: function (RunNumber) {
          this._runNumber = RunNumber;
        },
        retrieveLatestVersionOfObjects: sinon.stub().resolves(mockList),
      };

      objectController = new ObjectController(objService);

      reqMock.query.fields = [];
      reqMock.query.RunNumber = 123;
      await objectController.getObjects(reqMock, resMock);

      strictEqual(objService._runNumber, 123, 'Run number was not set on service');
    });
  });
};

/**
 * Helper function that checks for the generic errors thrown by the controller
 * @param {object} resMock - Mocked HTTP response object
 */
function checkGenericError(resMock) {
  ok(resMock.status.calledWith(502), 'Response status was not 502');
  ok(resMock.send.calledWith({ message: 'Unable to identify object or read it' }), 'Unexpected response');
}
