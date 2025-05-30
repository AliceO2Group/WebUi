import { suite, test } from 'node:test';
import { OWNER_TEST_TOKEN, URL_ADDRESS } from '../config.js';
import request from 'supertest';
import { deepStrictEqual } from 'node:assert';
import { MOCK_OBJECT_BY_ID_RESULT, OBJECT_BY_PATH_RESULT, OBJECT_LATEST_FILTERED_BY_RUN_NUMBER, OBJECT_VERSIONS,
  OBJECT_VERSIONS_FILTERED_BY_RUN_NUMBER, TREE_API_OBJECTS } from '../../setup/seeders/ccdbObjects.js';

export const apiGetObjectsTests = () => {
  suite('GET /object', () => {
    test('should return QCObject details with all versions', async () => {
      await request(`${URL_ADDRESS}/api/object`)
        .get(`?token=${OWNER_TEST_TOKEN}&path=qc/test/object/1`)
        .expect((res) => {
          const { versions } = res.body;
          delete res.body.versions; // versions is checked for individually.
          delete res.body.root;

          deepStrictEqual(res.body, OBJECT_BY_PATH_RESULT, 'Unexpected response');
          deepStrictEqual(versions, OBJECT_VERSIONS, 'Versions do not match up');
        });
    });

    test('should return QCObject versions if a filter is added', async () => {
      await request(`${URL_ADDRESS}/api/object`)
        .get(`?token=${OWNER_TEST_TOKEN}&path=qc/test/object/1&filters[RunNumber]=0`)
        .expect((res) => {
          const { versions } = res.body;
          delete res.body.versions; // versions is checked for individually.
          delete res.body.root;

          deepStrictEqual(res.body, OBJECT_BY_PATH_RESULT, 'Unexpected response');
          deepStrictEqual(versions, OBJECT_VERSIONS_FILTERED_BY_RUN_NUMBER, 'Versions do not match up');
        });
    });

    test('should return 400 if path parameter is missing', async () => {
      await request(`${URL_ADDRESS}/api/object`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect(400)
        .expect((res) =>
          deepStrictEqual(
            res.body,
            { message: 'Invalid URL parameters: missing object path' },
            'Should complain about missing path',
          ));
    });

    test('should return 400 if path parameter is not a string', async () => {
      await request(`${URL_ADDRESS}/api/object`)
        .get(`?token=${OWNER_TEST_TOKEN}&path[]=array`)
        .expect(400)
        .expect((res) =>
          deepStrictEqual(
            res.body,
            { message: 'Invalid URL parameters: missing object path' },
            'Should complain about invalid path type',
          ));
    });

    test('should return 502 if service fails to retrieve object', async () => {
      await request(`${URL_ADDRESS}/api/object`)
        .get(`?token=${OWNER_TEST_TOKEN}&path=invalid/path`)
        .expect(502)
        .expect((res) =>
          deepStrictEqual(
            res.body,
            { message: 'Unable to identify object or read it' },
            'Should show service failure message',
          ));
    });
  });

  suite('GET /object/:id', () => {
    test('should return QCObject details with all versions', async () => {
      await request(`${URL_ADDRESS}/api/object/6724a6bd1b2bad3d713cc4ee`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect((res) => {
          const { versions } = res.body;
          delete res.body.versions; // versions is checked for individually.
          delete res.body.root;

          deepStrictEqual(res.body, MOCK_OBJECT_BY_ID_RESULT, 'Unexpected response');
          deepStrictEqual(versions, OBJECT_VERSIONS, 'Versions do not match up');
        });
    });

    test('should return QCObject versions if a filter is added.', async () => {
      await request(`${URL_ADDRESS}/api/object/6724a6bd1b2bad3d713cc4ee`)
        .get(`?token=${OWNER_TEST_TOKEN}&filters[RunNumber]=0`)
        .expect((res) => {
          const { versions } = res.body;
          delete res.body.versions;
          delete res.body.root;

          deepStrictEqual(res.body, MOCK_OBJECT_BY_ID_RESULT, 'Unexpected response');
          deepStrictEqual(versions, OBJECT_VERSIONS_FILTERED_BY_RUN_NUMBER, 'Versions do not match up');
        });
    });

    // Error tests
    test('should return 400 if ID parameter is missing', async () => {
      await request(`${URL_ADDRESS}/api/object/ `)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect(400)
        .expect((res) => deepStrictEqual(res.body, { message: 'Invalid URL parameters: missing object ID' }));
    });

    test('should return 502 if service fails to retrieve object by ID', async () => {
      await request(`${URL_ADDRESS}/api/object/invalid_id`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect(502)
        .expect((res) =>
          deepStrictEqual(
            res.body,
            { message: 'Unable to identify object or read it by qcg id' },
            'Should send service failure message',
          ));
    });
  });

  suite('GET /objects', () => {
    test('should return object names when no filter is provided', async () => {
      await request(`${URL_ADDRESS}/api/objects`)
        .get(`?token=${OWNER_TEST_TOKEN}`)
        .expect((res) => deepStrictEqual(res.body, TREE_API_OBJECTS, 'Unexpected response'));
    });

    test('should return detailed objects when runNumber is provided', async () => {
      await request(`${URL_ADDRESS}/api/objects`)
        .get(`?token=${OWNER_TEST_TOKEN}&RunNumber=0`)
        .expect((res) => deepStrictEqual(res.body, OBJECT_LATEST_FILTERED_BY_RUN_NUMBER, 'Unexpected response'));
    });

    // Error tests
    test('should return 400 if prefix is not a string', async () => {
      await request(`${URL_ADDRESS}/api/objects`)
        .get(`?token=${OWNER_TEST_TOKEN}&prefix[]=array`)
        .expect(400)
        .expect((res) => {
          deepStrictEqual(
            res.body,
            { message: 'Invalid parameters provided: prefix must be of type string' },
            'Should send message about invalid prefix type',
          );
        });
    });

    test('should return 400 if fields is not an array', async () => {
      await request(`${URL_ADDRESS}/api/objects`)
        .get(`?token=${OWNER_TEST_TOKEN}&fields=not_an_array`)
        .expect(400)
        .expect((res) => {
          deepStrictEqual(
            res.body,
            { message: 'Invalid parameters provided: fields must be of type Array' },
            'Should send message about invalid fields type',
          );
        });
    });
  });
};
