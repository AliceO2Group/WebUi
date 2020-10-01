const assert = require('assert');
const sinon = require('sinon');
const SQLiteConnector = require('../db/sqlite.connector.js');

describe('SQLite database', () => {
  describe('Creating a new SQLite instance', () => {
    it('should throw an error if the pathname is not provided', () => {
      assert.throws(() => new SQLiteConnector(), new Error('No pathname provided'));
      assert.throws(() => new SQLiteConnector(null), new Error('No pathname provided'));
      assert.throws(() => new SQLiteConnector(undefined), new Error('No pathname provided'));
    });

    it('should successfully initialize SQLiteConnector', () => {
      assert.doesNotThrow(() => new SQLiteConnector('test-path'));
    });
  });

  describe('Make Query', () => {
    it('should successfully run a general query', () => {
      const sql = new SQLiteConnector('some-path');
      sql.db = {run: () => {}};
      const callback = sinon.fake.yields(null, null);

      sinon.replace(sql.db, 'run', callback);
      return assert.doesNotReject(async () => await sql.query('INSERT STATEMENT', [], false));
    });

    it('should throw error when general query fails', () => {
      const sql = new SQLiteConnector('some-path');
      sql.db = {run: () => {}};
      const error = new Error('DB did not close properly');
      const callback = sinon.fake.yields(error, null);

      sinon.replace(sql.db, 'run', callback);
      return assert.rejects(
        async () => await sql.query('INSERT STATEMENT', [], false),
        new Error('DB did not close properly')
      );
    });

    it('should successfully run a read query', async () => {
      const sql = new SQLiteConnector('some-path');
      sql.db = {all: () => {}};
      const connection = [{name: 'name', id: 'id'}];
      const callback = sinon.fake.yields(null, connection);

      sinon.replace(sql.db, 'all', callback);
      const rows = await sql.query('SELECT STATEMENT', [], true);
      assert.deepStrictEqual(rows, [{name: 'name', id: 'id'}], 'Rows were not received as expected');
      return assert.doesNotReject(async () => await sql.query('SELECT STATEMENT', []));
    });

    it('should throw error when read query fails', () => {
      const sql = new SQLiteConnector('some-path');
      sql.db = {all: () => {}};
      const error = new Error('DB did not successfully read data properly');
      const callback = sinon.fake.yields(error, null);

      sinon.replace(sql.db, 'all', callback);
      return assert.rejects(
        async () => await sql.query('SELECT STATEMENT', [], true),
        new Error('DB did not successfully read data properly')
      );
    });
  });

  describe('Close Connection', () => {
    it('should successfully close connection', () => {
      const sql = new SQLiteConnector('some-path');
      sql.db = {close: () => {}};
      const callback = sinon.fake.yields(null, null);

      sinon.replace(sql.db, 'close', callback);
      return assert.doesNotReject(async () => await sql.close());
    });

    it('should throw error if db could not close connection', () => {
      const sql = new SQLiteConnector('some-path');
      sql.db = {close: () => {}};
      const error = new Error('DB did not close properly');
      const callback = sinon.fake.yields(error, null);

      sinon.replace(sql.db, 'close', callback);
      return assert.rejects(async () => await sql.close(), new Error('DB did not close properly'));
    });
  });
});
