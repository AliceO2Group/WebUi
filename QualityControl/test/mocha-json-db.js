const assert = require('assert');
const fs = require('fs');
const path = require('path');
const JsonFileConnector = require('./../lib/JsonFileConnector.js');

const CONFIG_FILE = path.join(__dirname, 'db.json.temp');

const TEST_LAYOUT = {
  id: 123,
  name: 'test',
  owner_name: 'tests-boss',
  owner_id: 1
};

let jsonConfig;

describe('JSON file custom database', () => {
  before(() => {
    // Drop previous DB if exists
    try {
      fs.unlinkSync(CONFIG_FILE);
    } catch (error) { }
    jsonConfig = new JsonFileConnector(CONFIG_FILE);
  });

  it('Create a new layout', (done) => {
    jsonConfig
      .createLayout(TEST_LAYOUT)
      .then(() => done())
      .catch(done);
  });

  it('Read a layout', (done) => {
    jsonConfig.readLayout(TEST_LAYOUT.id).then((layout) => {
      assert.strictEqual(TEST_LAYOUT.name, layout.name);
      assert.strictEqual(TEST_LAYOUT.owner_name, layout.owner_name);
      assert.strictEqual(TEST_LAYOUT.id, layout.id);
      assert.strictEqual(TEST_LAYOUT.owner_id, layout.owner_id);
      done();
    }).catch(done);
  });

  it('Create a layout with the same name but different ID', (done) => {
    const layout = JSON.parse(JSON.stringify(TEST_LAYOUT));
    layout.id = 321;
    jsonConfig
      .createLayout(layout)
      .then(() => done())
      .catch(done);
  });

  it('Creating layout with the same ID should fail', (done) => {
    const layout = TEST_LAYOUT;
    jsonConfig
      .createLayout(layout)
      .then(() => done('should fail'))
      .catch((error) => done());
  });

  it('should save layout with new name', (done) => {
    TEST_LAYOUT.name = 'Updated Name';
    jsonConfig
      .updateLayout(TEST_LAYOUT.id, TEST_LAYOUT)
      .catch(done);

    jsonConfig.readLayout(TEST_LAYOUT.id).then((layout) => {
      assert.strictEqual(TEST_LAYOUT.name, layout.name);
      done();
    }).catch(done);
  });

  it('Delete layout', (done) => {
    jsonConfig
      .deleteLayout(TEST_LAYOUT.id)
      .then(() => done())
      .catch(done);
  });

  it('Reading deleted layout returns undefined', (done) => {
    jsonConfig
      .readLayout(TEST_LAYOUT.id)
      .then((result) => result === undefined ? done() : done('should return undefined'))
      .catch(done);
  });

  after(() => {
    fs.unlinkSync(CONFIG_FILE);
  });
});
