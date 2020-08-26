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

/* eslint-disable arrow-parens */
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
  this.timeout(20000);
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
    browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: true});
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
    assert.strictEqual(location.search, '?page=objectTree');
  });

  it('should have a layout with header, sidebar and section', async () => {
    const headerContent = await page.evaluate(() => document.querySelector('header').innerHTML);
    const sidebarContent = await page.evaluate(() => document.querySelector('nav').innerHTML);

    assert.ok(headerContent.includes('Quality Control'));
    assert.ok(sidebarContent.includes('Explore'));
  });

  describe('page layoutList', () => {
    before(async () => {
      await page.goto(url + '?page=layoutList', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert.strictEqual(location.search, '?page=layoutList');
    });

    it('should have a button for online mode in the header', async () => {
      await page.waitForSelector('header > div:nth-child(1) > div:nth-child(1) > button:nth-child(2)', {timeout: 5000});
      const onlineButton = await page.evaluate(() =>
        document.querySelector('header > div:nth-child(1) > div:nth-child(1) > button:nth-child(2)').title);
      assert.strictEqual(onlineButton, 'Toggle Mode (Online/Offline)');
    });

    it('should have a table with rows', async () => {
      const rowsCount = await page.evaluate(() => document.querySelectorAll('section table tbody tr').length);
      assert.ok(rowsCount > 1);
    });

    it('should have a table with one row after filtering', async () => {
      await page.type('header input', 'AliRoot');
      await page.waitFor(200);
      const rowsCount = await page.evaluate(() => document.querySelectorAll('section table tbody tr').length);
      assert.ok(rowsCount === 1);
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
      assert.strictEqual(location.search, '?page=layoutShow&layoutId=5aba4a059b755d517e76ea10&layoutName=AliRoot');
    });

    it('should have tabs in the header', async () => {
      const tabsCount = await page.evaluate(() => document.querySelectorAll('header .btn-tab').length);
      assert.ok(tabsCount > 1);
    });

    it('should have selected layout in the sidebar highlighted', async () => {
      const layoutClassList = await page.evaluate(() => document.querySelector('body > div > div > nav > div:nth-child(5) > a:nth-child(1)').classList);
      assert.deepStrictEqual(layoutClassList, {0: 'menu-item', 1: 'w-wrapped', 2: 'selected'});
    });

    it('should have jsroot svg plots in the section', async () => {
      const plotsCount = await page.evaluate(() => document.querySelectorAll('section svg.jsroot').length);
      assert.ok(plotsCount > 1);
    });

    it('should have an info button with full path and last modified when clicked (plot success)', async () => {
      await page.evaluate(() => document.querySelector('body > div > div > section > div > div > div:nth-child(3) > div > div > div:nth-child(2) > div > div > button').click());

      const result = await page.evaluate(() => {
        const infoButtonTitle = document.querySelector('body > div > div > section > div > div > div:nth-child(3) > div > div > div:nth-child(2) > div > div > button').title;
        const lastModified = document.querySelector('body > div > div > section > div > div > div:nth-child(3) > div > div > div:nth-child(2) > div > div > div > div:nth-child(2)').innerText;
        const path = document.querySelector('body > div > div > section > div > div > div:nth-child(3) > div > div > div:nth-child(2) > div > div > div > div').innerText;
        return {
          lastModified: lastModified,
          path: path,
          title: infoButtonTitle,
        };
      });
      assert.strictEqual(result.title, 'View details about histogram', 'Button title is different');
      assert.ok(result.path.includes('PATH'), 'Object full path label is not the same');
      assert.ok(result.path.includes('DAQ01/EventSizeClasses/class_C0ALSR-ABC'), 'Object full path is not the same');
      assert.ok(result.lastModified.includes('LAST MODIFIED'), 'Last Modified label is different');
      assert.strictEqual(result.lastModified.includes(new Date(100).toLocaleString('EN')), true, 'Last Modified date is different');
    });

    it('should have an info button with full path and last modified when clicked on a second plot(plot success)', async () => {
      const result = await page.evaluate(() => {
        const infoButtonTitle = document.querySelector('body > div > div > section > div > div > div:nth-child(2) > div > div > div:nth-child(2) > div > div > button').title;
        const lastModified = document.querySelector('body > div > div > section > div > div > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div > div:nth-child(2)').innerText;
        const path = document.querySelector('body > div > div > section > div > div > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div > div').innerText;
        return {
          lastModified: lastModified,
          path: path,
          title: infoButtonTitle,
        };
      });
      // click again to reset for other tests
      await page.evaluate(() => document.querySelector('body > div > div > section > div > div > div:nth-child(2) > div > div > div:nth-child(2) > div > div > button').click());
      assert.strictEqual(result.title, 'View details about histogram', 'Button title is different');
      assert.ok(result.path.includes('PATH'), 'Object full path label is not the same');
      assert.ok(result.path.includes('DAQ01/EventSizeClasses/class_C0AMU-AB'), 'Object full path is not the same');
      assert.ok(result.lastModified.includes('LAST MODIFIED'), 'Last Modified label is different');
      assert.strictEqual(result.lastModified.includes(new Date(1020).toLocaleString('EN')), true, 'Last Modified date is different');
    });

    it('should have second tab to be empty (according to demo data)', async () => {
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(2) > div > button:nth-child(2)').click());
      await page.waitForSelector('section h1', {timeout: 5000});
      const plotsCount = await page.evaluate(() => document.querySelectorAll('section svg.jsroot').length);
      assert.strictEqual(plotsCount, 0);
    });

    it('should have a button group containing three buttons in the header', async () => {
      const buttonCount = await page.evaluate(() =>
        document.querySelectorAll('header > div > div:nth-child(3) > div.btn-group > button').length);
      assert.strictEqual(buttonCount, 3);
    });

    it('should have one duplicate button in the header to create a new duplicated layout', async () => {
      await page.waitForSelector('header > div > div:nth-child(3) > div.btn-group > button:nth-child(1)', {timeout: 5000});
      const duplicateButton = await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div.btn-group > button:nth-child(1)').title);
      assert.strictEqual(duplicateButton, 'Duplicate layout');
    });

    it('should have one delete button in the header to delete layout', async () => {
      await page.waitForSelector('header > div > div:nth-child(3) > div.btn-group > button:nth-child(3)', {timeout: 5000});
      const deleteButton = await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div.btn-group > button:nth-child(3)').title);
      assert.strictEqual(deleteButton, 'Delete layout');
    });

    it('should have one edit button in the header to go in edit mode', async () => {
      await page.waitForSelector('header > div > div:nth-child(3) > div.btn-group > button:nth-child(1)', {timeout: 5000});
      const editButton = await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div.btn-group > button:nth-child(2)').title);
      assert.strictEqual(editButton, 'Edit layout');
    });

    // Begin: Edit Mode;
    it('should click the edit button in the header and enter edit mode', async () => {
      await page.waitForSelector('header > div > div:nth-child(3) > div > button:nth-child(1)', {timeout: 5000});
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > button:nth-child(2)').click());
    });

    it('should have input field for changing layout name in edit mode', async () => {
      await page.waitForSelector('header > div > div:nth-child(3) > input', {timeout: 5000});
      const count = await page.evaluate(() => document.querySelectorAll('header > div > div:nth-child(3) > input').length);
      assert.strictEqual(count, 1);
    });

    it('should have a tree sidebar in edit mode', async () => {
      await page.waitForSelector('nav table tbody tr'); // loading., {timeout: 5000}..
      const rowsCount = await page.evaluate(() => document.querySelectorAll('nav table tbody tr').length);
      assert.strictEqual(rowsCount, 5); // 5 agents
    });

    it('should have filtered results on input search filled', async () => {
      await page.type('nav > div > div > div:nth-child(2) > input', 'HistoWithRandom');
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
      assert.strictEqual(location.search, '?page=objectTree');
    });

    it('should have a tree as a table', async () => {
      await page.waitForSelector('section table tbody tr', {timeout: 5000});
      const rowsCount = await page.evaluate(() => document.querySelectorAll('section table tbody tr').length);
      assert.strictEqual(rowsCount, 5); // 5 agents
    });

    it('should have a button to sort by (default "Name" ASC)', async () => {
      const sortByButtonTitle = await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div').title);
      assert.strictEqual(sortByButtonTitle, 'Sort by');
    });

    it('should have first element in tree as "BIGTREE/120KB/0"', async () => {
      const firstElement = await page.evaluate(() => window.model.object.currentList[0]);
      assert.strictEqual(firstElement.name, 'BIGTREE/120KB/0');
    });

    it('should sort list of histograms by name in descending order', async () => {
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > button').click());
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > div > a:nth-child(4)').click());
      const sorted = await page.evaluate(() => {
        return {
          list: window.model.object.currentList,
          sort: window.model.object.sortBy
        };
      });
      assert.strictEqual(sorted.sort.title, 'Name');
      assert.strictEqual(sorted.sort.order, -1);
      assert.strictEqual(sorted.sort.field, 'name');
      assert.strictEqual(sorted.list[0].name, 'TST01/Default/hTOFRRawTimeVsTRM3671');
    });

    it('should sort list of histograms by name in ascending order', async () => {
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > button').click());
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > div > a:nth-child(3)').click());
      const sorted = await page.evaluate(() => {
        return {
          list: window.model.object.currentList,
          sort: window.model.object.sortBy
        };
      });
      assert.strictEqual(sorted.sort.title, 'Name');
      assert.strictEqual(sorted.sort.order, 1);
      assert.strictEqual(sorted.sort.field, 'name');
      assert.strictEqual(sorted.list[0].name, 'BIGTREE/120KB/0');
    });

    it('should sort list of histograms by created time in descending order', async () => {
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > button').click());
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > div > a:nth-child(2)').click());
      const sorted = await page.evaluate(() => {
        return {
          list: window.model.object.currentList,
          sort: window.model.object.sortBy
        };
      });
      assert.strictEqual(sorted.sort.title, 'Created Time');
      assert.strictEqual(sorted.sort.order, -1);
      assert.strictEqual(sorted.sort.field, 'createTime');
      assert.strictEqual(sorted.list[0].name, 'BIGTREE/120KB/2499');
    });

    it('should sort list of histograms by created time in ascending order', async () => {
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > button').click());
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > div > a:nth-child(1)').click());
      const sorted = await page.evaluate(() => {
        return {
          list: window.model.object.currentList,
          sort: window.model.object.sortBy
        };
      });
      assert.strictEqual(sorted.sort.title, 'Created Time');
      assert.strictEqual(sorted.sort.order, 1);
      assert.strictEqual(sorted.sort.field, 'createTime');
      assert.strictEqual(sorted.list[0].name, 'BIGTREE/120KB/0');
    });

    it('should have filtered results on input search filled and display only the ones visible to the user (less than 2500)', async () => {
      await page.type('header input', 'BIGTREE');
      const rowsDisplayed = await page.evaluate(() => {
        const rows = [];
        document.querySelectorAll('section table tbody tr').forEach((item) => rows.push(item.innerText));
        return rows;
      }, {timeout: 5000});
      const allRowsContainBIGTREE = rowsDisplayed.filter((name) => name.includes('BIGTREE')).length === rowsDisplayed.length;
      assert.ok(allRowsContainBIGTREE, 'Not all rows contain the searched term');
    });
  });

  describe('page objectView', () => {
    describe('objectView called from objectTree', () => {
      it('should load page=objectView and display error message & icon due to missing objectName parameter', async () => {
        await page.goto(url + '?page=objectView', {waitUntil: 'networkidle0'});
        const result = await page.evaluate(() => {
          const errorMessage = document.querySelector('body > div > div:nth-child(2) > div > span').textContent;
          const iconClassList = document.querySelector('div div:nth-child(2) div svg').classList;
          const backButtonTitle = document.querySelector('div div div a').title;

          return {
            location: window.location,
            message: errorMessage,
            iconClassList: iconClassList,
            backButtonTitle: backButtonTitle
          };
        });
        assert.strictEqual(result.location.search, '?page=objectView');
        assert.strictEqual(result.message, 'No object name or object ID were provided');
        assert.deepStrictEqual(result.iconClassList, {0: 'icon', 1: 'fill-primary'});
        assert.strictEqual(result.backButtonTitle, 'Go back to all objects');
      });

      it('should take back the user to page=objectTree when clicking "Back To QCG" (no object passed or selected)', async () => {
        await page.evaluate(() => document.querySelector('div div div a').click());

        const result = await page.evaluate(() => {
          return {
            location: window.location.search,
            objectSelected: window.model.object.selected
          };
        });
        assert.strictEqual(result.location, '?page=objectTree');
        assert.strictEqual(result.objectSelected, null);
      });

      it('should load page=objectView and display an error message when a parameter objectName is passed but object not found', async () => {
        const objectName = 'NOT_FOUND_OBJECT';
        await page.goto(url + `?page=objectView&objectName=${objectName}`, {waitUntil: 'networkidle0'});
        const result = await page.evaluate(() => {
          const title = document.querySelector('body > div > div:nth-child(2) > div > div > span').textContent;
          return {
            title: title,
          };
        });
        assert.strictEqual(result.title, 'Object NOT_FOUND_OBJECT could not be loaded');
      });

      it('should load page=objectView and display a plot when a parameter objectName is passed', async () => {
        const objectName = 'DAQ01/EquipmentSize/CPV/CPV';
        await page.goto(url + `?page=objectView&objectName=${objectName}`, {waitUntil: 'networkidle0'});
        const result = await page.evaluate(() => {
          const title = document.querySelector('div div b').innerText;
          const rootPlotClassList = document.querySelector('body > div > div:nth-child(2) > div > div').classList;
          const objectSelected = window.model.object.selected;
          return {
            title: title,
            rootPlotClassList: rootPlotClassList,
            objectSelected: objectSelected
          };
        });
        assert.strictEqual(result.title, objectName);
        assert.deepStrictEqual(result.rootPlotClassList, {0: 'relative', 1: 'jsroot-container'});
        assert.deepStrictEqual(result.objectSelected, {name: objectName, createTime: 3, lastModified: 100, version: null});
      });

      it('should have an info button with full path and last modified when clicked (plot success)', async () => {
        await page.evaluate(() => document.querySelector('body > div > div > div:nth-child(3) > div > div > button').click());

        const result = await page.evaluate(() => {
          const infoButtonTitle = document.querySelector('body > div > div > div:nth-child(3) > div > div > button').title;
          const fullPath = document.querySelector('body > div > div > div:nth-child(3) > div > div > div > div').innerText;
          const lastModified = document.querySelector('body > div > div > div:nth-child(3) > div > div > div > div:nth-child(2)').innerText;
          return {
            title: infoButtonTitle,
            fullPath: fullPath,
            lastModified: lastModified,
          };
        });
        assert.strictEqual(result.title, 'View details about histogram');
        assert.ok(result.fullPath.includes('PATH'));
        assert.ok(result.fullPath.includes('DAQ01/EquipmentSize/CPV/CPV'));
        assert.ok(result.lastModified.includes('LAST MODIFIED'));
        assert.ok(result.lastModified.includes(new Date(100).toLocaleString('EN')));
      });

      it('should load page=objectView and display a Checker Object when a parameter objectName is passed', async () => {
        const objectName = 'qcg/checker/AB';
        await page.goto(url + `?page=objectView&objectName=${objectName}`, {waitUntil: 'networkidle0'});

        const result = await page.evaluate(() => {
          const title = document.querySelector('div div b').textContent;
          const rootPlotClassList = document.querySelector('body > div > div:nth-child(2) > div > div').classList;
          const objectSelected = window.model.object.selected;
          return {
            title: title,
            rootPlotClassList: rootPlotClassList,
            objectSelected: objectSelected
          };
        });
        assert.strictEqual(result.title, objectName);
        assert.deepStrictEqual(result.rootPlotClassList, {0: 'relative', 1: 'p2', 2: 'flex-column', 3: 'scroll-y'});
        assert.deepStrictEqual(result.objectSelected, {name: objectName, createTime: 2, lastModified: 100, version: null});
      });
    });

    describe('objectView called from layoutShow', () => {
      it('should load page=objectView and display error message & icon due to missing objectID parameter', async () => {
        await page.goto(url + '?page=objectView', {waitUntil: 'networkidle0'});
        const result = await page.evaluate(() => {
          const errorMessage = document.querySelector('body > div > div:nth-child(2) > div > span').textContent;
          const iconClassList = document.querySelector('div div:nth-child(2) div svg').classList;
          const backButtonTitle = document.querySelector('div div div a').title;

          return {
            location: window.location,
            message: errorMessage,
            iconClassList: iconClassList,
            backButtonTitle: backButtonTitle
          };
        });
        assert.strictEqual(result.location.search, '?page=objectView');
        assert.strictEqual(result.message, 'No object name or object ID were provided');
        assert.deepStrictEqual(result.iconClassList, {0: 'icon', 1: 'fill-primary'});
        assert.strictEqual(result.backButtonTitle, 'Go back to all objects');
      });

      it('should load page=objectView and display error message & icon due to missing layoutId parameter', async () => {
        await page.goto(url + '?page=objectView&objectId=123456', {waitUntil: 'networkidle0'});
        const result = await page.evaluate(() => {
          const errorMessage = document.querySelector('body > div > div:nth-child(2) > div > span').textContent;
          const iconClassList = document.querySelector('div div:nth-child(2) div svg').classList;
          const backButtonTitle = document.querySelector('div div div a').title;

          return {
            location: window.location,
            message: errorMessage,
            iconClassList: iconClassList,
            backButtonTitle: backButtonTitle
          };
        });
        assert.strictEqual(result.location.search, '?page=objectView&objectId=123456');
        assert.strictEqual(result.message, 'No layout ID was provided');
        assert.deepStrictEqual(result.iconClassList, {0: 'icon', 1: 'fill-primary'});
        assert.strictEqual(result.backButtonTitle, 'Go back to all objects');
      });

      it('should take back the user to page=objectTree when clicking "Back To QCG" (no object passed or selected)', async () => {
        await page.evaluate(() => document.querySelector('div div div a').click());

        const result = await page.evaluate(() => {
          return {
            location: window.location.search,
            objectSelected: window.model.object.selected
          };
        });
        assert.strictEqual(result.location, '?page=objectTree');
        assert.strictEqual(result.objectSelected, null);
      });

      it('should load a plot and update button text to "Go back to layout" if layoutId parameter is provided', async () => {
        const objectId = '5aba4a059b755d517e76ef54';
        const layoutId = '5aba4a059b755d517e76ea10';
        await page.goto(url + `?page=objectView&objectId=${objectId}&layoutId=${layoutId}`, {waitUntil: 'networkidle0'});

        const result = await page.evaluate(() => {
          const backButtonTitle = document.querySelector('div div div a').title;
          return {
            location: window.location.search,
            backButtonTitle: backButtonTitle
          };
        });
        assert.strictEqual(result.location, `?page=objectView&objectId=5aba4a059b755d517e76ef54&layoutId=5aba4a059b755d517e76ea10`);
        assert.strictEqual(result.backButtonTitle, 'Go back to layout');
      });

      it('should take back the user to page=layoutShow when clicking "Go back to layout"', async () => {
        const layoutId = '5aba4a059b755d517e76ea10';
        await page.evaluate(() => document.querySelector('div div div a').click());

        const result = await page.evaluate(() => {
          return {
            location: window.location.search,
          };
        });
        assert.strictEqual(result.location, `?page=layoutShow&layoutId=${layoutId}`);
      });

      it('should load page=objectView and display a plot when objectId and layoutId are passed', async () => {
        const objectId = '5aba4a059b755d517e76ef54';
        const layoutId = '5aba4a059b755d517e76ea10';
        await page.goto(url + `?page=objectView&objectId=${objectId}&layoutId=${layoutId}`, {waitUntil: 'networkidle0'});
        const result = await page.evaluate(() => {
          const title = document.querySelector('div div b').textContent;
          const rootPlotClassList = document.querySelector('body > div > div:nth-child(2) > div > div').classList;
          const objectSelected = window.model.object.selected;
          return {
            title: title,
            rootPlotClassList: rootPlotClassList,
            objectSelected: objectSelected
          };
        });
        await page.waitFor(7000);
        assert.strictEqual(result.title, 'DAQ01/EquipmentSize/CPV/CPV(AliRoot)');
        assert.deepStrictEqual(result.rootPlotClassList, {0: 'relative', 1: 'jsroot-container'});
        assert.deepStrictEqual(result.objectSelected, {name: 'DAQ01/EquipmentSize/CPV/CPV', createTime: 3, lastModified: 100, version: null});
      });

      it('should have an info button with full path and last modified when clicked (plot success)', async () => {
        await page.evaluate(() => document.querySelector('body > div > div > div:nth-child(3) > div > div > button').click());
        const result = await page.evaluate(() => {
          const infoButtonTitle = document.querySelector('body > div > div > div:nth-child(3) > div > div > button').title;
          const fullPath = document.querySelector('body > div > div > div:nth-child(3) > div > div > div > div').innerText;
          const lastModified = document.querySelector('body > div > div > div:nth-child(3) > div > div > div > div:nth-child(2)').innerText;
          return {
            title: infoButtonTitle,
            fullPath: fullPath,
            lastModified: lastModified,
          };
        });
        await page.waitFor(200);
        assert.strictEqual(result.title, 'View details about histogram');
        assert.ok(result.fullPath.includes('PATH'));
        assert.ok(result.fullPath.includes('DAQ01/EquipmentSize/CPV/CPV'));
        assert.ok(result.lastModified.includes('LAST MODIFIED'));
        assert.strictEqual(result.lastModified.includes(new Date(100).toLocaleString('EN')), true, 'Last Modified Date is not correct');
      });
    });
  });

  describe('page frameworkInfo', () => {
    before('reset browser to google', async () => {
      // weird bug, if we don't go to external website just here, all next goto will wait forever
      await page.goto('http://google.com', {waitUntil: 'networkidle0'});
    });

    it('should load', async () => {
      await page.goto(url + '?page=about', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert.strictEqual(location.search, '?page=about');
    });

    it('should have a frameworkInfo item with config fields', async () => {
      const expConfig = {
        qcg: {port: 8181, hostname: 'localhost'},
        consul: {hostname: 'localhost', port: 8500},
        ccdb: {hostname: 'ccdb', port: 8500, prefix: 'test'},
        quality_control: {version: '0.19.5-1'}
      };
      const config = await page.evaluate(() => window.model.frameworkInfo.item);
      delete config.payload.qcg.version;
      assert.deepStrictEqual(config.payload, expConfig);
    });
  });

  describe('QCObject - drawing options', async () => {
    before('reset browser to google', async () => {
      // weird bug, if we don't go to external website just here, all next goto will wait forever
      await page.goto('http://google.com', {waitUntil: 'networkidle0'});
    });

    it('should load', async () => {
      // id 5aba4a059b755d517e76ea12 is set in QCModelDemo
      await page.goto(url + '?page=layoutShow&layoutId=5aba4a059b755d517e76ea10&layoutName=AliRoot', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert.strictEqual(location.search, '?page=layoutShow&layoutId=5aba4a059b755d517e76ea10&layoutName=AliRoot');
    });

    it('should merge options on layoutShow and no ignoreDefaults field', async () => {
      const drawingOptions = await page.evaluate(() => {
        const tabObject = {options: ['args', 'coly']};
        const objectRemoteData = {payload: {qcObject: {fOption: 'lego colz'}}};
        return window.model.object.generateDrawingOptions(tabObject, objectRemoteData);
      });

      const expDrawingOpts = ['lego', 'colz', 'args', 'coly'];
      assert.deepStrictEqual(drawingOptions, expDrawingOpts);
    });

    it('should merge options on layoutShow and false ignoreDefaults field', async () => {
      const drawingOptions = await page.evaluate(() => {
        const tabObject = {ignoreDefaults: false, options: ['args', 'coly']};
        const objectRemoteData = {payload: {qcObject: {fOption: 'lego colz'}}};
        return window.model.object.generateDrawingOptions(tabObject, objectRemoteData);
      });

      const expDrawingOpts = ['lego', 'colz', 'args', 'coly'];
      assert.deepStrictEqual(drawingOptions, expDrawingOpts);
    });

    it('should ignore default options on layoutShow and true ignoreDefaults field', async () => {
      const drawingOptions = await page.evaluate(() => {
        const tabObject = {ignoreDefaults: true, options: ['args', 'coly']};
        const objectRemoteData = {payload: {qcObject: {fOption: 'lego colz'}}};
        return window.model.object.generateDrawingOptions(tabObject, objectRemoteData);
      });

      const expDrawingOpts = ['args', 'coly'];
      assert.deepStrictEqual(drawingOptions, expDrawingOpts);
    });

    it('should use only default options on objectTree', async () => {
      const drawingOptions = await page.evaluate(() => {
        window.model.page = 'objectTree';
        const tabObject = {options: ['args', 'coly']};
        const objectRemoteData = {payload: {qcObject: {fOption: 'lego colz'}}};
        return window.model.object.generateDrawingOptions(tabObject, objectRemoteData);
      });

      const expDrawingOpts = ['lego', 'colz'];
      assert.deepStrictEqual(drawingOptions, expDrawingOpts);
    });

    it('should use only default options(foption and metadata) on objectView when no layoutId or objectId is set', async () => {
      const drawingOptions = await page.evaluate(() => {
        window.model.page = 'objectView';
        window.model.router.params.objectId = undefined;
        window.model.router.params.layoutId = undefined;
        const tabObject = {options: ['args', 'coly']};
        const objectRemoteData = {payload: {qcObject: {fOption: 'lego colz', metadata: {displayHints: 'hint hint2', drawOptions: 'option option2'}}}};
        return window.model.object.generateDrawingOptions(tabObject, objectRemoteData);
      });

      const expDrawingOpts = ['lego', 'colz', 'option', 'option2', 'hint', 'hint2'];
      assert.deepStrictEqual(expDrawingOpts, drawingOptions);
    });

    it('should use only default options on objectView when no layoutId is set', async () => {
      const drawingOptions = await page.evaluate(() => {
        window.model.page = 'objectView';
        window.model.router.params.layoutId = undefined;
        window.model.router.params.objectId = '123';
        const tabObject = {options: ['args', 'coly']};
        const objectRemoteData = {payload: {qcObject: {fOption: 'lego colz'}}};
        return window.model.object.generateDrawingOptions(tabObject, objectRemoteData);
      });

      const expDrawingOpts = ['lego', 'colz'];
      assert.deepStrictEqual(drawingOptions, expDrawingOpts);
    });


    it('should use only default options on objectView when no objectId is set', async () => {
      const drawingOptions = await page.evaluate(() => {
        window.model.page = 'objectView';
        window.model.router.params.objectId = undefined;
        window.model.router.params.layoutId = '123';
        const tabObject = {options: ['args', 'coly']};
        const objectRemoteData = {payload: {qcObject: {fOption: 'lego colz'}}};
        return window.model.object.generateDrawingOptions(tabObject, objectRemoteData);
      });

      const expDrawingOpts = ['lego', 'colz'];
      assert.deepStrictEqual(drawingOptions, expDrawingOpts);
    });

    it('should merge options on objectView and no ignoreDefaults field', async () => {
      const drawingOptions = await page.evaluate(() => {
        window.model.page = 'objectView';
        window.model.router.params.objectId = '5aba4a059b755d517e76ef54';
        window.model.router.params.layoutId = '5aba4a059b755d517e76ea10';
        window.model.layout.requestedLayout.kind = 'Success';
        window.model.layout.requestedLayout.payload = {};
        window.model.layout.requestedLayout.payload.tabs = [{
          id: '5aba4a059b755d517e76eb61', name: 'SDD', objects: [{
            id: '5aba4a059b755d517e76ef54',
            options: ['gridx'], name: 'DAQ01/EquipmentSize/CPV/CPV', x: 0, y: 0, w: 1, h: 1
          }]
        }];
        const objectRemoteData = {payload: {qcObject: {fOption: 'lego colz'}}};
        return window.model.object.generateDrawingOptions(null, objectRemoteData);
      });

      const expDrawingOpts = ['lego', 'colz', 'gridx'];
      assert.deepStrictEqual(drawingOptions, expDrawingOpts);
    });

    it('should merge options on objectView and false ignoreDefaults field', async () => {
      const drawingOptions = await page.evaluate(() => {
        window.model.page = 'objectView';
        window.model.router.params.objectId = '5aba4a059b755d517e76ef54';
        window.model.router.params.layoutId = '5aba4a059b755d517e76ea10';
        window.model.layout.requestedLayout.kind = 'Success';
        window.model.layout.requestedLayout.payload = {};
        window.model.layout.requestedLayout.payload.tabs = [{
          id: '5aba4a059b755d517e76eb61', name: 'SDD', objects: [{
            id: '5aba4a059b755d517e76ef54',
            options: ['gridx'], ignoreDefaults: false, name: 'DAQ01/EquipmentSize/CPV/CPV', x: 0, y: 0, w: 1, h: 1
          }]
        }];
        const objectRemoteData = {payload: {qcObject: {fOption: 'lego colz'}}};
        return window.model.object.generateDrawingOptions(null, objectRemoteData);
      });

      const expDrawingOpts = ['lego', 'colz', 'gridx'];
      assert.deepStrictEqual(drawingOptions, expDrawingOpts);
    });

    it('should ignore default options on objectView and true ignoreDefaults field', async () => {
      const drawingOptions = await page.evaluate(() => {
        window.model.page = 'objectView';
        window.model.router.params.objectId = '5aba4a059b755d517e76ef54';
        window.model.router.params.layoutId = '5aba4a059b755d517e76ea10';
        window.model.layout.requestedLayout.kind = 'Success';
        window.model.layout.requestedLayout.payload = {};
        window.model.layout.requestedLayout.payload.tabs = [{
          id: '5aba4a059b755d517e76eb61', name: 'SDD', objects: [{
            id: '5aba4a059b755d517e76ef54',
            options: ['gridx'], ignoreDefaults: true, name: 'DAQ01/EquipmentSize/CPV/CPV', x: 0, y: 0, w: 1, h: 1
          }]
        }];
        const objectRemoteData = {payload: {qcObject: {fOption: 'lego colz'}}};
        return window.model.object.generateDrawingOptions(null, objectRemoteData);
      });

      const expDrawingOpts = ['gridx'];
      assert.deepStrictEqual(drawingOptions, expDrawingOpts);
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
