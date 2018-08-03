const assert = require('assert');
const fs = require('fs');
const JsonFileConnector = require('./../lib/JsonFileConnector.js');

const CONFIG_FILE = 'db.json.temp';
const jsonConfig = new JsonFileConnector(CONFIG_FILE);

const TEST_LAYOUT = {
  id: 123,
  name: "test",
  owner_name: "tests-boss",
  owner_id: 1
}; 

describe('JSON file custom database', () => {
  it('Create a new layout', (done) => {
    jsonConfig.createLayout(TEST_LAYOUT).then(() => {
      done();
    });
  });

  it('Read layout', (done) => {
    jsonConfig.readLayout("test").then((layout) => {
      assert.strictEqual(TEST_LAYOUT.name, layout.name);
      assert.strictEqual(TEST_LAYOUT.owner_name, layout.owner_name);
      assert.strictEqual(TEST_LAYOUT.id, layout.id);
      assert.strictEqual(TEST_LAYOUT.owner_id, layout.owner_id);
      done();
    });
  });

  it('Create layout with the same name', (done) => {
    let layout = TEST_LAYOUT;
    layout.id = 321;
    jsonConfig.createLayout(layout).then(() => {
      done(); // THIS SHOULD NOT BE POSSIBLE !!!
    }); 
  }); 

  it('Delete layout', (done) => {
    jsonConfig.deleteLayout("test").then(() => {
      done();
    }); 
  }); 
}); 
