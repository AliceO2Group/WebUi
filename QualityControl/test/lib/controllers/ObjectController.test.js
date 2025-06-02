import test, { afterEach, beforeEach, suite } from 'node:test';
import { ok } from 'node:assert';
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
    reqMock = { query: { token: 'someToken' } };
  });

  afterEach(() => {
    sinon.restore();
  });

  suite.skip('getObjectContent() tests', () => {
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
};
