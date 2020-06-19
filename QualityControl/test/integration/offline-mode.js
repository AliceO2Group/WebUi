/* eslint-disable max-len */
const assert = require('assert');
const qcg = require('./qcg-test');

let url;
let page;
let objects;

describe('`OFFLINE` test-suite', async () => {
  before(async () => {
    url = qcg.url;
    page = qcg.page;
    objects = qcg.offlineObjects;
  });

  it('should successfully load objectTree page', async () => {
    await page.goto(url + '?page=objectTree', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    await page.waitFor(2000);
    assert.strictEqual(location.search, '?page=objectTree', 'Could not load page objectTree');
  });

  it('should successfully receive a list of objects from CCDB', async () => {

  });
  it('should successfully receive certain objects from CCDB', async () => {

  });
  it('should successfully open subtree of object ???????', async () => {

  });
  it('should successfully open 50% size plot of the object', async () => {

  });

  it('should successfully open subtree of checker ???????', async () => {

  });
  it('should successfully open 50% size display of checker', async () => {

  });
});

