const assert = require('assert');
const sinon = require('sinon');
const SQLiteConnector = require('../db/SQLiteConnector.js');

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
    it('should successfully run a read statement', () => {
    });
  });
});
