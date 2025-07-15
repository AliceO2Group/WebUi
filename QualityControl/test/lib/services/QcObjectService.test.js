import { deepStrictEqual, strictEqual } from 'node:assert';
import { suite, test, before, beforeEach, afterEach } from 'node:test';
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
      test('should update cache with parsed objects and timestamp on success', async () => {
        const mockObjects = [
          { path: '/objects/path1', created: '2023-01-01T00:00:00Z' },
          { path: '/objects/path2', created: '2023-01-02T00:00:00Z' },
          { path: '/objects/path3', created: '2023-01-03T00:00:00Z' },
        ];
        dbService.getObjectsTreeList.resolves(mockObjects);
        const beforeTime = Date.now();

        const result = await qcObjectService.refreshCache();

        const afterTime = Date.now();
        const cached = qcObjectService._cache.objects;

        strictEqual(result, true);
        strictEqual(cached.length, 3);
        strictEqual(typeof qcObjectService._cache.lastUpdate, 'number');
        strictEqual(qcObjectService._cache.lastUpdate >= beforeTime, true);
        strictEqual(qcObjectService._cache.lastUpdate <= afterTime, true);
        
        deepStrictEqual(cached.map((o) => o.name), [
          '/objects/path1',
          '/objects/path2',
          '/objects/path3',
        ]);

        // Verify it uses CACHE_PREFIX, not PREFIX
        strictEqual(dbService.getObjectsTreeList.calledOnceWithExactly('test-prefix'), true);
      });

      test('should return false and not update cache on error', async () => {
        const originalCache = { objects: ['existing'], lastUpdate: 12345 };
        qcObjectService._cache = { ...originalCache };

        dbService.getObjectsTreeList.rejects(new Error('CCDB connection failed'));

        const result = await qcObjectService.refreshCache();

        strictEqual(result, false);
        // Cache should remain unchanged
        deepStrictEqual(qcObjectService._cache, originalCache);
        strictEqual(dbService.getObjectsTreeList.calledOnceWithExactly('test-prefix'), true);
      });

      test('should perform cache update', async () => {
        const mockObjects = [{ path: '/test/obj', created: '2023-01-01T00:00:00Z' }];
        dbService.getObjectsTreeList.resolves(mockObjects);

        await qcObjectService.refreshCache();

        // Verify both objects and lastUpdate are set together
        strictEqual(qcObjectService._cache.objects.length, 1);
        strictEqual(typeof qcObjectService._cache.lastUpdate, 'number');
        strictEqual(qcObjectService._cache.objects[0].name, '/test/obj');
      });

      test('should handle empty objects list', async () => {
        dbService.getObjectsTreeList.resolves([]);

        const result = await qcObjectService.refreshCache();

        strictEqual(result, true);
        strictEqual(qcObjectService._cache.objects.length, 0);
        strictEqual(typeof qcObjectService._cache.lastUpdate, 'number');
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
