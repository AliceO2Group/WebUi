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
    const offlineObjects = await page.evaluate(() => window.model.object.list);
    assert.ok(offlineObjects.length > 0, `Did not receive any objects from CCDB`);
  });

  it('should successfully receive certain objects from CCDB and be in use', async () => {
    const offlineObjects = await page.evaluate(() => window.model.object.currentList);
    const offlineNames = offlineObjects.map((object) => object.name);
    const expectedObjects = objects;
    const contains = expectedObjects.filter((object) => !offlineNames.includes(object));
    assert.strictEqual(contains.length, 0, `Could not find following objects from the expected ones: ${contains}`);
  });

  it('should successfully open subtree of OBJECT plot and select/open plot', async () => {
    const paths = objects[0].split('/');
    paths.shift();

    for (let i = 0; i < paths.length; ++i) {
      const [row] = await page.$x(`//tr[td[text()="${paths[i]}"]]`);
      if (row) {
        await row.click();
        await page.waitFor(200);
      } else {
        assert.ok(false, `${paths[i]} could not be found in object tree`);
      }
    }

    const panelWidth = await page.evaluate(() => document.querySelector('section > div > div > div:nth-child(2)').style.width);
    assert.strictEqual(panelWidth, '50%', 'Panel containing object plot was not opened successfully');
  });

  it('should successfully open subtree of CHECKER plot and select/open plot', async () => {
    const paths = objects[1].split('/');
    paths.shift();

    for (let i = 0; i < paths.length; ++i) {
      const [row] = await page.$x(`//tr[td[text()="${paths[i]}"]]`);
      if (row) {
        await row.click();
        await page.waitFor(200);
      } else {
        assert.ok(false, `${paths[i]} could not be found in object tree`);
      }
    }

    const panelWidth = await page.evaluate(() => document.querySelector('section > div > div > div:nth-child(2)').style.width);
    assert.strictEqual(panelWidth, '50%', 'Panel containing object checker was not opened successfully');
  });
});
