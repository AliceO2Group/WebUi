/* eslint-disable max-len */
const puppeteer = require('puppeteer');
const assert = require('assert');
const config = require('../test-config.js');
const {spawn} = require('child_process');

// APIs:
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
// https://mochajs.org/

// Tips:
// Network and rendering can have delays this can leads to random failures
// if they are tested just after their initialization.

describe('QCG', function() {
  let browser;
  let page;
  let subprocess; // web-server runs into a subprocess
  let subprocessOutput = '';
  this.timeout(10000);
  this.slow(2000);
  const url = 'http://' + config.http.hostname + ':' + config.http.port + '/';

  before(async () => {
    // Start web-server in background
    subprocess = spawn('node', ['index.js', 'test/test-config.js'], {stdio: 'pipe'});
    subprocess.stdout.on('data', (chunk) => {
      subprocessOutput += chunk.toString();
    });
    subprocess.stderr.on('data', (chunk) => {
      subprocessOutput += chunk.toString();
    });

    this.ok = true;
    // Start browser to test UI
    browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    page = await browser.newPage();

    // Listen to browser
    page.on('error', pageerror => {
      console.error('        ', pageerror);
      this.ok = false;
    });
    page.on('pageerror', pageerror => {
      console.error('        ', pageerror);
      this.ok = false;
    });
    page.on('console', msg => {
      for (let i = 0; i < msg.args().length; ++i) {
        console.log(`        ${msg.args()[i]}`);
      }
    });
  });

  it('should load first page "/"', async () => {
    // try many times until backend server is ready
    for (let i = 0; i < 10; i++) {
      try {
        await page.goto(url, {waitUntil: 'networkidle0'});
        break; // conneciton ok, this test passed
      } catch (e) {
        if (e.message.includes('net::ERR_CONNECTION_REFUSED')) {
          await new Promise((done) => setTimeout(done, 500));
          continue; // try again
        }
        throw e;
      }
    }
  });

  it('should have redirected to default page "/?page=objectTree"', async () => {
    const location = await page.evaluate(() => window.location);
    assert(location.search === '?page=objectTree');
  });

  it('should have a layout with header, sidebar and section', async () => {
    const headerContent = await page.evaluate(() => document.querySelector('header').innerHTML);
    const sidebarContent = await page.evaluate(() => document.querySelector('nav').innerHTML);

    assert(headerContent.includes('Quality Control'));
    assert(sidebarContent.includes('Explore'));
  });

  describe('page layoutList', () => {
    before(async () => {
      await page.goto(url + '?page=layoutList', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert(location.search === '?page=layoutList');
    });

    it('should have a button for the Online mode in the header', async () => {
      await page.waitForSelector('header > div:nth-child(1) > div:nth-child(1) > button:nth-child(3)', {timeout: 5000});
      const onlineButton = await page.evaluate(() =>
        document.querySelector('header > div:nth-child(1) > div:nth-child(1) > button:nth-child(3)').title);
      assert.deepStrictEqual(onlineButton, 'Online');
    });

    it('should have a table with rows', async () => {
      const rowsCount = await page.evaluate(() => document.querySelectorAll('section table tbody tr').length);
      assert(rowsCount > 1);
    });

    it('should have a table with one row after filtering', async () => {
      await page.type('header input', 'AliRoot');
      await page.waitFor(200);
      const rowsCount = await page.evaluate(() => document.querySelectorAll('section table tbody tr').length);
      assert(rowsCount === 1);
    });

    it('should have a link to show a layout', async () => {
      await page.evaluate(() => document.querySelector('section table tbody tr a').click());
      const location = await page.evaluate(() => window.location);
      assert.strictEqual(location.search, '?page=layoutShow&layoutId=5aba4a059b755d517e76ea10&layoutName=AliRoot');
      // id 5aba4a059b755d517e76ea10 is set in QCModelDemo
    });
  });

  describe('page layoutShow', () => {
    before('reset browser to google', async () => {
      // weird bug, if we don't go to external website just here, all next goto will wait forever
      await page.goto('http://google.com', {waitUntil: 'networkidle0'});
    });

    it('should load', async () => {
      // id 5aba4a059b755d517e76ea12 is set in QCModelDemo
      await page.goto(url + '?page=layoutShow&layoutId=5aba4a059b755d517e76ea10&layoutName=AliRoot', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert.deepStrictEqual(location.search, '?page=layoutShow&layoutId=5aba4a059b755d517e76ea10&layoutName=AliRoot');
    });

    it('should have tabs in the header', async () => {
      const tabsCount = await page.evaluate(() => document.querySelectorAll('header .btn-tab').length);
      assert(tabsCount > 1);
    });

    it('should have selected layout in the sidebar highlighted', async () => {
      const layoutClassList = await page.evaluate(() => document.querySelector('nav div a:nth-child(7)').classList);
      assert.deepStrictEqual(layoutClassList, {0: 'menu-item', 1: 'w-wrapped', 2: 'selected'});
    });

    it('should have jsroot svg plots in the section', async () => {
      const plotsCount = await page.evaluate(() => document.querySelectorAll('section svg.jsroot').length);
      assert(plotsCount > 1);
    });

    it('should have second tab to be empty (according to demo data)', async () => {
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(2) > div > button:nth-child(2)').click());
      await page.waitForSelector('section h1', {timeout: 5000});
      const plotsCount = await page.evaluate(() => document.querySelectorAll('section svg.jsroot').length);
      assert.deepStrictEqual(plotsCount, 0);
    });

    it('should have a button group containing three buttons in the header', async () => {
      const buttonCount = await page.evaluate(() =>
        document.querySelectorAll('header > div > div:nth-child(3) > div.btn-group > button').length);
      assert.deepStrictEqual(buttonCount, 3);
    });

    it('should have one duplicate button in the header to create a new duplicated layout', async () => {
      await page.waitForSelector('header > div > div:nth-child(3) > div.btn-group > button:nth-child(1)', {timeout: 5000});
      const duplicateButton = await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div.btn-group > button:nth-child(1)').title);
      assert.deepStrictEqual(duplicateButton, 'Duplicate layout');
    });

    it('should have one delete button in the header to delete layout', async () => {
      await page.waitForSelector('header > div > div:nth-child(3) > div.btn-group > button:nth-child(3)', {timeout: 5000});
      const deleteButton = await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div.btn-group > button:nth-child(3)').title);
      assert.deepStrictEqual(deleteButton, 'Delete layout');
    });

    it('should have one edit button in the header to go in edit mode', async () => {
      await page.waitForSelector('header > div > div:nth-child(3) > div.btn-group > button:nth-child(1)', {timeout: 5000});
      const editButton = await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div.btn-group > button:nth-child(2)').title);
      assert.deepStrictEqual(editButton, 'Edit layout');
    });

    // Begin: Edit Mode;
    it('should click the edit button in the header and enter edit mode', async () => {
      await page.waitForSelector('header > div > div:nth-child(3) > div > button:nth-child(1)', {timeout: 5000});
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > button:nth-child(2)').click());
    });

    it('should have input field for changing layout name in edit mode', async () => {
      await page.waitForSelector('header > div > div:nth-child(3) > input', {timeout: 5000});
      const count = await page.evaluate(() => document.querySelectorAll('header > div > div:nth-child(3) > input').length);
      assert.deepStrictEqual(count, 1);
    });

    it('should have a tree sidebar in edit mode', async () => {
      await page.waitForSelector('nav table tbody tr'); // loading., {timeout: 5000}..
      const rowsCount = await page.evaluate(() => document.querySelectorAll('nav table tbody tr').length);
      assert.deepStrictEqual(rowsCount, 4); // 4 agents
    });

    it('should have filtered results on input search filled', async () => {
      await page.type('nav input', 'HistoWithRandom');
      await page.waitForFunction(`document.querySelectorAll('nav table tbody tr').length === 1`, {timeout: 5000});
    });

    it('should show normal sidebar after Cancel click', async () => {
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > button:nth-child(2)').click());
      await page.waitForSelector('nav .menu-title', {timeout: 5000});
    });
  });

  describe('page objectTree', () => {
    before('reset browser to google', async () => {
      // weird bug, if we don't go to external website just here, all next goto will wait forever
      await page.goto('http://google.com', {waitUntil: 'networkidle0'});
    });

    it('should load', async () => {
      await page.goto(url + '?page=objectTree', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert(location.search === '?page=objectTree');
    });

    it('should have a tree as a table', async () => {
      await page.waitForSelector('section table tbody tr', {timeout: 5000});
      const rowsCount = await page.evaluate(() => document.querySelectorAll('section table tbody tr').length);
      assert.deepStrictEqual(rowsCount, 4); // 4 agents
    });

    it('should have filtered results on input search filled', async () => {
      await page.type('header input', 'HistoWithRandom');
      await page.waitForFunction(`document.querySelectorAll('section table tbody tr').length === 1`, {timeout: 5000});
    });
  });

  describe('page objectView', () => {
    it('should load page=objectView and display error message & icon due to missing objectName parameter', async () => {
      await page.goto(url + '?page=objectView', {waitUntil: 'networkidle0'});
      const result = await page.evaluate(() => {
        const errorMessage = document.querySelector('div div b').textContent;
        const iconClassList = document.querySelector('div div:nth-child(2) div svg').classList;
        const backButtonTitle = document.querySelector('div div div a').title;

        return {
          location: window.location,
          message: errorMessage,
          iconClassList: iconClassList,
          backButtonTitle: backButtonTitle
        };
      });
      assert.deepStrictEqual(result.location.search, '?page=objectView');
      assert.deepStrictEqual(result.message, 'Please pass an objectName parameter');
      assert.deepStrictEqual(result.iconClassList, {0: 'icon', 1: 'fill-primary'});
      assert.deepStrictEqual(result.backButtonTitle, 'Go back to all objects');
    });

    it('should take back the user to page=objectTree when clicking "Back To QCG" (no object passed or selected)', async () => {
      await page.evaluate(() => document.querySelector('div div div a').click());

      const result = await page.evaluate(() => {
        return {
          location: window.location.search,
          objectSelected: window.model.object.selected
        };
      });
      assert.deepStrictEqual(result.location, '?page=objectTree');
      assert.deepStrictEqual(result.objectSelected, null);
    });

    it('should load page=objectView and display a plot when a parameter objectName is passed', async () => {
      const objectName = 'DAQ01/EquipmentSize/CPV/CPV';
      await page.goto(url + `?page=objectView&objectName=${objectName}`, {waitUntil: 'networkidle0'});
      const result = await page.evaluate(() => {
        const title = document.querySelector('div div b').textContent;
        const rootPlotClassList = document.querySelector('div div:nth-child(2) div div').classList;
        const objectSelected = window.model.object.selected;
        return {
          title: title,
          rootPlotClassList: rootPlotClassList,
          objectSelected: objectSelected
        };
      });
      assert.deepStrictEqual(result.title, objectName);
      assert.deepStrictEqual(result.rootPlotClassList, {0: 'relative', 1: 'jsroot-container'});
      assert.deepStrictEqual(result.objectSelected, {name: objectName});
    });

    it('should take back the user to page=objectTree when clicking "Back To QCG" (object passed and selected)', async () => {
      const objectName = 'DAQ01/EquipmentSize/CPV/CPV';
      await page.evaluate(() => document.querySelector('div div div a').click());

      const result = await page.evaluate(() => {
        return {
          location: window.location.search,
          objectSelected: window.model.object.selected
        };
      });
      assert.deepStrictEqual(result.location, '?page=objectTree');
      assert.deepStrictEqual(result.objectSelected, {name: objectName});
    });

    it('should update button text to "Go back to layout" if layoutId parameter is provided', async () => {
      const objectName = 'DAQ01/EquipmentSize/CPV/CPV';
      const layoutId = '5aba4a059b755d517e76ea10';
      await page.goto(url + `?page=objectView&objectName=${objectName}&layoutId=${layoutId}`, {waitUntil: 'networkidle0'});

      const result = await page.evaluate(() => {
        const backButtonTitle = document.querySelector('div div div a').title;
        return {
          location: window.location.search,
          backButtonTitle: backButtonTitle
        };
      });
      assert.deepStrictEqual(result.location, `?page=objectView&objectName=DAQ01%2FEquipmentSize%2FCPV%2FCPV&layoutId=5aba4a059b755d517e76ea10`);
      assert.deepStrictEqual(result.backButtonTitle, 'Go back to layout');
    });

    it('should take back the user to page=layoutShow when clicking "Go back to layout" (object passed and selected)', async () => {
      await page.evaluate(() => document.querySelector('div div div a').click());
      const objectName = 'DAQ01/EquipmentSize/CPV/CPV';
      const layoutId = '5aba4a059b755d517e76ea10';
      const result = await page.evaluate(() => {
        return {
          location: window.location.search,
          objectSelected: window.model.object.selected
        };
      });
      assert.deepStrictEqual(result.location, `?page=layoutShow&layoutId=${layoutId}`);
      assert.deepStrictEqual(result.objectSelected, {name: objectName});
    });
  });

  beforeEach(() => {
    this.ok = true;
  });

  afterEach(() => {
    if (!this.ok) throw new Error('something went wrong');
  });

  after(async () => {
    await browser.close();
    console.log('---------------------------------------------');
    console.log('Output of server logs for the previous tests:');
    console.log(subprocessOutput);
    subprocess.kill();
  });
});
