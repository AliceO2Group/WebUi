import { strict as assert } from 'assert';
import { suite, test, beforeEach } from 'node:test';
import { ObjectController } from '../../../lib/controllers/ObjectController.js';
import sinon from 'sinon';

export const objectControllerTestSuite = async () => {
  suite('ObjectController test suite', () => {
    let res = null;
    let req = null;
    let qcObjectServiceStub = null;
    let objectController = null;

    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };
      req = {
        params: {},
        query: {},
      };
      qcObjectServiceStub = {
        retrieveLatestVersionOfObjects: sinon.stub(),
        retrieveQcObjectByQcgId: sinon.stub(),
        retrieveQcObject: sinon.stub(),
      };
      objectController = new ObjectController(qcObjectServiceStub);
    });

    suite('`getObjects()` tests', () => {
      test('should return 400 if prefix is not a string', async () => {
        const req = {
          query: { prefix: 123, fields: [] },
        };

        await objectController.getObjects(req, res);

        assert.ok(res.status.calledWith(400));
        assert.ok(res.json.calledWith({
          message: 'Invalid parameters provided: prefix must be of type string',
          title: 'Invalid Input',
          status: 400,
        }));
      });

      test('should return 400 if fields is not an array', async () => {
        const req = {
          query: { prefix: 'some/path', fields: 'not-an-array' },
        };

        await objectController.getObjects(req, res);

        assert.ok(res.status.calledWith(400));
        assert.ok(res.json.calledWith({
          message: 'Invalid parameters provided: fields must be of type Array',
          title: 'Invalid Input',
          status: 400,
        }));
      });

      test('should return 200 and list of objects if parameters are valid', async () => {
        const mockList = [{ name: 'object1' }, { name: 'object2' }];
        qcObjectServiceStub.retrieveLatestVersionOfObjects.resolves(mockList);

        const req = {
          query: { prefix: 'valid/path', fields: ['field1', 'field2'] },
        };

        await objectController.getObjects(req, res);

        assert.ok(res.status.calledWith(200));
        assert.ok(res.json.calledWith(mockList));
      });

      test('should return 500 if service throws error', async () => {
        qcObjectServiceStub.retrieveLatestVersionOfObjects.rejects(new Error('Service failed'));

        const req = {
          query: { prefix: 'valid/path', fields: ['f'] },
        };

        await objectController.getObjects(req, res);

        assert.ok(res.status.calledWith(500));
        assert.ok(res.json.calledWith({
          message: 'Failed to retrieve list of objects latest version',
          title: 'Unknown Error',
          status: 500,
        }));
      });
    });

    suite('`getObjectsContent()` test suite', () => {
      test('should return a 400 error if URL is invalid', async () => {
        await objectController.getObjectContent(req, res);
        assert.ok(res.json.calledWith({
          message: 'Invalid URL parameters: missing object path',
          title: 'Invalid Input',
          status: 400,
        }));
      });
      test('should return 200 with the QcObject', async () => {
        const mockObject = { id: 'obj1', name: 'Test Object' };

        req.query = {
          path: 'valid/path.json',
          validFrom: '1700000000',
          id: 'id123',
          filters: JSON.stringify({ a: 'b', empty: '' }),
        };

        qcObjectServiceStub.retrieveQcObject.resolves(mockObject);

        await objectController.getObjectContent(req, res);

        assert.ok(res.status.calledWith(200));
        assert.ok(res.json.calledWith(mockObject));
      });
      test('should return a 500 error if service fails', async () => {
        const error = new Error('Service failure');

        req.query = {
          path: 'valid/path.json',
          validFrom: '1700000000',
          id: 'id123',
          filters: JSON.stringify({ key: 'value' }),
        };

        qcObjectServiceStub.retrieveQcObject.rejects(error);

        objectController.updateAndSendExpressResponseFromNativeError = (res, err) => {
          res.status(500).json({
            message: err.message,
            title: 'Unknown error',
            status: 500,
          });
        };

        await objectController.getObjectContent(req, res);

        assert.ok(res.status.calledWith(500));
        assert.ok(res.json.calledWith({
          message: 'Unable to identify object or read it',
          title: 'Unknown Error',
          status: 500,
        }));
      });
      test('should pass empty filters object if filters param is not object/string', async () => {
        req.query = {
          path: 'some/path',
          id: 'sub-id',
          validFrom: '2024',
          filters: 42,
        };

        const mockObject = { name: 'NoFilters' };

        qcObjectServiceStub.retrieveQcObject.resolves(mockObject);

        await objectController.getObjectContent(req, res);

        assert.ok(qcObjectServiceStub.retrieveQcObject
          .calledWith('some/path', 2024, 'sub-id', {}));
        assert.ok(res.status.calledWith(200));
        assert.ok(res.json.calledWith(mockObject));
      });
      test('should pass empty filters object if filters param is a malformed JSON string', async () => {
        req.query = {
          path: 'some/path',
          id: 'sub-id',
          validFrom: '2024',
          filters: '{invalidJson:true', // invalid json
        };

        const mockObject = { name: 'BadJsonFilters' };

        qcObjectServiceStub.retrieveQcObject.resolves(mockObject);

        await objectController.getObjectContent(req, res);

        assert.ok(qcObjectServiceStub.retrieveQcObject
          .calledWith('some/path', 2024, 'sub-id', {}));
        assert.ok(res.status.calledWith(200));
        assert.ok(res.json.calledWith(mockObject));
      });
      test('should clean filters if any is empty', async () => {
        req.query = {
          path: 'some/path',
          id: 'sub-id',
          validFrom: '2024',
          filters: { RunModes: 'PEDESTAL', PassNumber: '' },
        };

        const mockObject = { name: 'FilteredObject' };

        qcObjectServiceStub.retrieveQcObject.resolves(mockObject);

        await objectController.getObjectContent(req, res);

        assert.ok(qcObjectServiceStub.retrieveQcObject
          .calledWith('some/path', 2024, 'sub-id', { RunModes: 'PEDESTAL' }));
        assert.ok(res.status.calledWith(200));
        assert.ok(res.json.calledWith(mockObject));
      });
      test('should clean filters and pass empty object if only filter is empty', async () => {
        req.query = {
          path: 'some/path',
          id: 'sub-id',
          validFrom: '2024',
          filters: { PassNumber: '' },
        };

        const mockObject = { name: 'FilteredObject' };

        qcObjectServiceStub.retrieveQcObject.resolves(mockObject);

        await objectController.getObjectContent(req, res);

        assert.ok(qcObjectServiceStub.retrieveQcObject
          .calledWith('some/path', 2024, 'sub-id', {}));
        assert.ok(res.status.calledWith(200));
        assert.ok(res.json.calledWith(mockObject));
      });
    });

    suite('`getObjectById()` tests', () => {
      test('should return 400 if ID param is missing', async () => {
        await objectController.getObjectById(req, res);

        assert.ok(res.status.calledWith(400));
        assert.ok(res.json.calledWith({
          message: 'Invalid URL parameters: missing object ID',
          title: 'Invalid Input',
          status: 400,
        }));
      });

      test('should return 200 and the object if retrieval is successful', async () => {
        const mockObject = { name: 'ObjectName' };
        req.params.id = 'abc123';
        req.query = { id: 'sub-id', validFrom: '2024-01-01', filters: { foo: 'bar' } };

        qcObjectServiceStub.retrieveQcObjectByQcgId.resolves(mockObject);

        await objectController.getObjectById(req, res);

        assert.ok(qcObjectServiceStub.retrieveQcObjectByQcgId
          .calledWith('abc123', 'sub-id', '2024-01-01', { foo: 'bar' }));
        assert.ok(res.status.calledWith(200));
        assert.ok(res.json.calledWith(mockObject));
      });

      test('should call errorHandler with 404 if service throws error', async () => {
        req.params.id = 'abc123';
        req.query = { id: 'some-id' };

        const error = new Error('Service failure');
        qcObjectServiceStub.retrieveQcObjectByQcgId.rejects(error);

        await objectController.getObjectById(req, res);
        assert.ok(res.json.calledWith({
          message: 'Unable to identify object or read it by qcg id',
          title: 'Not Found',
          status: 404,
        }));
        assert.ok(res.status.calledWith(404));
      });
      test('should pass empty filters object if filters param is not object/string', async () => {
        req.params.id = 'abc123';
        req.query = {
          id: 'sub-id',
          validFrom: '2024-01-01',
          filters: 42,
        };

        const mockObject = { name: 'NoFilters' };

        qcObjectServiceStub.retrieveQcObjectByQcgId.resolves(mockObject);

        await objectController.getObjectById(req, res);

        assert.ok(qcObjectServiceStub.retrieveQcObjectByQcgId
          .calledWith('abc123', 'sub-id', '2024-01-01', {}));
        assert.ok(res.status.calledWith(200));
        assert.ok(res.json.calledWith(mockObject));
      });
      test('should pass empty filters object if filters param is a malformed JSON string', async () => {
        req.params.id = 'abc123';
        req.query = {
          id: 'sub-id',
          validFrom: '2024-01-01',
          filters: '{invalidJson:true', // invalid JSON
        };

        const mockObject = { name: 'BadJsonFilters' };

        qcObjectServiceStub.retrieveQcObjectByQcgId.resolves(mockObject);

        await objectController.getObjectById(req, res);

        assert.ok(qcObjectServiceStub.retrieveQcObjectByQcgId
          .calledWith('abc123', 'sub-id', '2024-01-01', {}));
        assert.ok(res.status.calledWith(200));
        assert.ok(res.json.calledWith(mockObject));
      });
      test('should clean filters if any is empty', async () => {
        req.params.id = 'abc123';
        req.query = {
          id: 'sub-id',
          validFrom: '2024-01-01',
          filters: { RunModes: 'PEDESTAL', PassNumber: '' },
        };

        const mockObject = { name: 'FilteredObject' };
        qcObjectServiceStub.retrieveQcObjectByQcgId.resolves(mockObject);

        await objectController.getObjectById(req, res);

        assert.ok(qcObjectServiceStub.retrieveQcObjectByQcgId
          .calledWith('abc123', 'sub-id', '2024-01-01', { RunModes: 'PEDESTAL' }));
        assert.ok(res.status.calledWith(200));
        assert.ok(res.json.calledWith(mockObject));
      });
      test('should clean filters and pass empty object if only filter is empty', async () => {
        req.params.id = 'abc123';
        req.query = {
          id: 'sub-id',
          validFrom: '2024-01-01',
          filters: { PassNumber: '' },
        };
        const mockObject = { name: 'FilteredObject' };
        qcObjectServiceStub.retrieveQcObjectByQcgId.resolves(mockObject);
        await objectController.getObjectById(req, res);
        assert.ok(qcObjectServiceStub.retrieveQcObjectByQcgId
          .calledWith('abc123', 'sub-id', '2024-01-01', {}));
        assert.ok(res.status.calledWith(200));
        assert.ok(res.json.calledWith(mockObject));
      });
    });
  });
};
