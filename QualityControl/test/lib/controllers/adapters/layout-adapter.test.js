import { LayoutAdapter } from '../../../../lib/controllers/adapters/layout-adapter.js';
import test, { suite } from 'node:test';
import { deepStrictEqual, throws } from 'node:assert';
import { LAYOUT_ADAPTED_MOCK, LAYOUT_INPUT_MOCK } from '../../../demoData/layout/layout.mock.js';

export const layoutAdapterTestSuite = async () => {
  suite('LayoutAdapter.adaptLayoutForExpressAPI', () => {
    test('should correctly adapt a valid layout object', () => {
      const result = LayoutAdapter.adaptLayoutForExpressAPI(LAYOUT_INPUT_MOCK);
      deepStrictEqual(result, LAYOUT_ADAPTED_MOCK);
    });

    test('should throw an when input is malformed', () => {
      const badInput = null;

      throws(
        () => LayoutAdapter.adaptLayoutForExpressAPI(badInput),
        new Error ("Error adapting layout: Cannot read properties of null (reading 'id')"),
      );
    });
  });
};
