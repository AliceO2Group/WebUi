import { deepStrictEqual } from 'node:assert';
import { suite, test } from 'node:test';

import { LAYOUT_FROM_BACKEND, LAYOUT_ADAPTED_FOR_FRONTEND_API } from '../../../demoData/layout/layout.mock.js';
import { LayoutAdapter } from '../../../../lib/controllers/adapters/layout-adapter.js';

export const layoutAdapterTestSuite = async () => {
  suite('LayoutAdapter Test Suite', () => {
    test('should adapt layout correctly without fields filter', () => {
      const adaptedLayout = LayoutAdapter.adaptLayoutForExpressAPI(LAYOUT_FROM_BACKEND);
      deepStrictEqual(sortKeys(adaptedLayout), sortKeys(LAYOUT_ADAPTED_FOR_FRONTEND_API));
    });
    test('should adapt layout correctly with fields filter', () => {
      const adaptedLayout = LayoutAdapter.adaptLayoutForExpressAPI(LAYOUT_FROM_BACKEND, ['id', 'name']);
      deepStrictEqual(
        sortKeys(adaptedLayout),
        sortKeys({ id: LAYOUT_ADAPTED_FOR_FRONTEND_API.id, name: LAYOUT_ADAPTED_FOR_FRONTEND_API.name }),
      );
    });
  });
};

/**
 * Recursively sorts the keys of an object.
 * @param {object} obj The object to sort.
 * @returns {object} A new object with sorted keys.
 */
function sortKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }
  if (obj && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((res, key) => {
        res[key] = sortKeys(obj[key]);
        return res;
      }, {});
  }
  return obj;
}
