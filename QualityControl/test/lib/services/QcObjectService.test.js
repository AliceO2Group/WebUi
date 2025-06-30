import { deepStrictEqual, strictEqual } from 'node:assert';
import { suite, test, before, beforeEach } from 'node:test';
import nock from 'nock';
import { QcObjectService } from '../../../lib/services/QcObject.service.js';
import { stub } from 'sinon';

export const qcObjectServiceTestSuite = async () => {
  suite('QC Object Service Test Suite -', () => {
    let dbService = undefined;
    let qcObjectService = undefined;
    const chartRepository = undefined;
    const rootService = undefined;

    before(() => {
      nock.cleanAll();
    });
    beforeEach(() => {
      dbService = {
        getObjectsTreeList: stub(),
        PREFIX: 'test-prefix',
        CACHE_PREFIX: 'test-prefix',
        _protocol: 'http',
        _hostname: 'localhost',
        _port: 1234,
        getObjectsLatestVersionList: stub(),
        getObjectIdentification: stub(),
        getObjectDetails: stub(),
      };
      qcObjectService = new QcObjectService(dbService, chartRepository, rootService);
    });

    suite('refreshCache', async () => {
      test('should update object paths in cache', async () => {
        const objects = [
          { path: '/objects/path1', created: '2023-01-01T00:00:00Z' },
          { path: '/objects/path2', created: '2023-01-02T00:00:00Z' },
          { path: '/objects/path3', created: '2023-01-03T00:00:00Z' },
        ];
        dbService.getObjectsTreeList.resolves(objects);
        await qcObjectService.refreshCache();
        const cached = qcObjectService._cache.objects;
        strictEqual(cached.length, 3);
        strictEqual(typeof qcObjectService._cache.lastUpdate, 'number');
        deepStrictEqual(cached.map((o) => o.name), [
          '/objects/path1',
          '/objects/path2',
          '/objects/path3',
        ]);
      });
      test('should not update cache if error getting objects tree list', async () => {
        dbService.getObjectsTreeList.rejects(new Error('Error getting objects tree list'));
        await qcObjectService.refreshCache();
        strictEqual(qcObjectService._cache.objects, undefined);
      });
    });

    suite('retrieveLatestVersionOfObjects', async () => {
      test('should retrieve cached objects if cache is not empty and no filters are provided', async () => {
        qcObjectService._cache.objects = [
          { name: '/path/object1', path: '/path/object1', created: '2023-01-01T00:00:00Z' },
          { name: '/path/object2', path: '/path/object2', created: '2023-01-02T00:00:00Z' },
          { name: 'prefix2/object3', path: 'prefix2/object3', created: '2023-01-03T00:00:00Z' },
        ];

        const result = await qcObjectService.retrieveLatestVersionOfObjects({ filters: {}, prefix: '/path/' });

        strictEqual(result.length, 2);
        deepStrictEqual(result, [
          { name: '/path/object1', path: '/path/object1', created: '2023-01-01T00:00:00Z' },
          { name: '/path/object2', path: '/path/object2', created: '2023-01-02T00:00:00Z' },
        ]);
      });
      test('should get objects from ccdb using `tree` endpoint if empty cache and no filters', async () => {
        const mockObjects = [
          { path: '/path/a' },
          { path: '/path/b' },
        ];

        qcObjectService._cache.objects = undefined;
        dbService.getObjectsTreeList.resolves(mockObjects);

        const result = await qcObjectService.retrieveLatestVersionOfObjects({ filters: {}, prefix: '/path/' });

        strictEqual(result.length, 2);
        deepStrictEqual(result, [
          { name: '/path/a' },
          { name: '/path/b' },
        ]);
        strictEqual(dbService.getObjectsTreeList.calledOnceWithExactly('/path/'), true);
      });
      test('should get objects from ccdb using `latest` endpoint if filters are provided', async () => {
        const mockObjects = [
          { path: '/filtered/obj1' },
          { path: '/filtered/obj2' },
        ];

        dbService.getObjectsLatestVersionList.resolves(mockObjects);

        const result = await qcObjectService.retrieveLatestVersionOfObjects({
          prefix: '/filtered/',
          filters: { passName: 123 },
          fields: ['path', 'created'],
        });

        strictEqual(result.length, 2);
        deepStrictEqual(result, [
          { name: '/filtered/obj1' },
          { name: '/filtered/obj2' },
        ]);
        strictEqual(dbService.getObjectsLatestVersionList.calledOnce, true);
      });
    });
    suite('retrieveQcObject', async () => { });
    suite('retrieveQcObjectByQcId', async () => { });
  });
};
