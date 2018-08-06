const assert = require('assert');
const fs = require('fs');
const path = require('path');
const JsonFileConnector = require('./../lib/JsonFileConnector.js');

const CONFIG_FILE = path.join(__dirname, 'db.json.temp');

const TEST_LAYOUT = {
  id: 123,
  name: "test",
  owner_name: "tests-boss",
  owner_id: 1
};

let jsonConfig;

describe('JSON file custom database', () => {
  before(() => {
    // don't keep DB from one test to another
    try {
      fs.unlinkSync(CONFIG_FILE);
    } catch (error) {}
    jsonConfig = new JsonFileConnector(CONFIG_FILE);
  });

  it('Create a new layout', (done) => {
    jsonConfig
      .createLayout(TEST_LAYOUT)
      .then(() => done())
      .catch(done);
  });

  it('Read layout', (done) => {
    jsonConfig.readLayout(TEST_LAYOUT.id).then((layout) => {
      assert.strictEqual(TEST_LAYOUT.name, layout.name);
      assert.strictEqual(TEST_LAYOUT.owner_name, layout.owner_name);
      assert.strictEqual(TEST_LAYOUT.id, layout.id);
      assert.strictEqual(TEST_LAYOUT.owner_id, layout.owner_id);
      done();
    }).catch(done);
  });

  it('Create layout with the same name', (done) => {
    let layout = JSON.parse(JSON.stringify(TEST_LAYOUT));
    layout.id = 321;
    jsonConfig
      .createLayout(layout)
      .then(() => done())
      .catch(done);
  });

  it('Create layout with the same id should fail', (done) => {
    let layout = TEST_LAYOUT;
    jsonConfig
      .createLayout(layout)
      .then(() => done('should fail'))
      .catch((error) => done());
  });

  it('Delete layout', (done) => {
    jsonConfig
      .deleteLayout(TEST_LAYOUT.id)
      .then(() => done())
      .catch(done);
  });

  it('Read deleted layout returns undefined', (done) => {
    jsonConfig
      .readLayout(TEST_LAYOUT.id)
      .then((result) => result === undefined ? done() : done('should return undefined'))
      .catch(done);
  });

  after(() => {
    fs.unlinkSync(CONFIG_FILE);
  });
});
