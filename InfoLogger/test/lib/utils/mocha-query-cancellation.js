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

const assert = require('assert');
const sinon = require('sinon');
const {
  throwIfQueryAborted,
  attachAbortDestroyHandler,
} = require('../../../lib/utils/queryCancellation.js');

describe('\'queryCancellation\' utils test suite', () => {
  describe('\'throwIfQueryAborted()\' - test suite', () => {
    it('should not throw when signal is missing', () => {
      assert.doesNotThrow(() => throwIfQueryAborted(null));
    });

    it('should not throw when signal is not aborted', () => {
      const controller = new AbortController();
      assert.doesNotThrow(() => throwIfQueryAborted(controller.signal));
    });

    it('should throw a QUERY_CANCELLED error when signal is aborted', () => {
      const controller = new AbortController();
      controller.abort();

      assert.throws(
        () => throwIfQueryAborted(controller.signal),
        (error) => {
          assert.strictEqual(error.message, 'Query cancelled by client');
          assert.strictEqual(error.code, 'QUERY_CANCELLED');
          return true;
        },
      );
    });
  });

  describe('\'attachAbortDestroyHandler()\' - test suite  ', () => {
    it('should return a noop cleanup when signal is missing', () => {
      const connection = { destroy: sinon.spy() };
      const onDestroyed = sinon.spy();

      const detach = attachAbortDestroyHandler(null, connection, onDestroyed);

      assert.strictEqual(typeof detach, 'function');
      assert.doesNotThrow(() => detach());
      assert.strictEqual(connection.destroy.callCount, 0);
      assert.strictEqual(onDestroyed.callCount, 0);
    });

    it('should destroy connection and call callback when signal aborts', () => {
      const controller = new AbortController();
      const connection = { destroy: sinon.spy() };
      const onDestroyed = sinon.spy();

      const detach = attachAbortDestroyHandler(controller.signal, connection, onDestroyed);
      controller.abort();
      detach();

      assert.strictEqual(onDestroyed.callCount, 1);
      assert.strictEqual(connection.destroy.callCount, 1);
    });

    it('should not destroy connection after handler is detached', () => {
      const controller = new AbortController();
      const connection = { destroy: sinon.spy() };
      const onDestroyed = sinon.spy();

      const detach = attachAbortDestroyHandler(controller.signal, connection, onDestroyed);
      detach();
      controller.abort();

      assert.strictEqual(onDestroyed.callCount, 0);
      assert.strictEqual(connection.destroy.callCount, 0);
    });
  });
});
