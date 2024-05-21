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
const { spawn } = require('child_process');

/*
 * APIs:
 * https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
 * https://mochajs.org/
 */

/*
 * Tips:
 * Network and rendering can have delays this can leads to random failures
 * if they are tested just after their initialization.
 */

describe('QCG', function () {
  let browser;
  let page;
  let subprocess; // Web-server runs into a subprocess
  let subprocessOutput = '';
  this.timeout(25000);
  this.slow(2000);
  const url = `http://${config.http.hostname}:${config.http.port}/`;

  before(async () => {
    // Start web-server in background
    subprocess = spawn('node', ['index.js', 'test/test-config.js'], { stdio: 'pipe' });
    subprocess.stdout.on('data', (chunk) => {
      subprocessOutput += chunk.toString();
    });
    subprocess.stderr.on('data', (chunk) => {
      subprocessOutput += chunk.toString();
    });

    this.ok = true;
    // Start browser to test UI
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: 'new' });
    page = await browser.newPage();

    exports.page = page;

    exports.url = url;

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
    // Try many times until backend server is ready
    for (let i = 0; i < 10; i++) {
      try {
        await page.goto(url, { waitUntil: 'networkidle0' });
        break; // Connection ok, this test passed
      } catch (e) {
        if (e.message.includes('net::ERR_CONNECTION_REFUSED')) {
          await new Promise((done) => setTimeout(done, 500));
          continue; // Try again
        }
        throw e;
      }
    }
  });

  it('should have redirected to default page "/?page=layoutList"', async () => {
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=layoutList');
  });

  it('should have correctly load QCG configuration', async () => {
    const qcg = await page.evaluate(() => window.QCG);
    const expectedConf = {
      REFRESH_MIN_INTERVAL: 10,
      REFRESH_MAX_INTERVAL: 120,
      CONSUL_SERVICE: true,
    };
    assert.deepStrictEqual(qcg, expectedConf, 'Public configuration was not loaded successfully');
  });

  it('should have a layout with header, sidebar and section', async () => {
    const headerContent = await page.evaluate(() => document.querySelector('header').innerHTML);
    const sidebarContent = await page.evaluate(() => document.querySelector('nav').innerHTML);

    assert.ok(headerContent.includes('Quality Control'));
    assert.ok(sidebarContent.includes('Explore'));
  });

  require('./pages');

  describe('QCObject - drawing options', async () => {
    /*
     * Before('reset browser to google', async () => {
     *   // weird bug, if we don't go to external website just here, all next goto will wait forever
     *   await page.goto('http://google.com', {waitUntil: 'networkidle0'});
     * });
     */

    it('should load', async () => {
      // Id 5aba4a059b755d517e76ea12 is set in QCModelDemo
      await page.goto(`${url}?page=layoutShow&layoutId=5aba4a059b755d517e76ea10`, { waitUntil: 'networkidle0' });
      const location = await page.evaluate(() => window.location);
      assert.strictEqual(location.search, '?page=layoutShow&layoutId=5aba4a059b755d517e76ea10');
    });

    it('should merge options on layoutShow and no ignoreDefaults field', async () => {
      const drawingOptions = await page.evaluate(() => {
        const tabObject = { options: ['args', 'coly'] };
        const objectRemoteData = { payload: { qcObject: { fOption: 'lego colz' } } };
        return window.model.object.generateDrawingOptions(tabObject, objectRemoteData);
      });

      const expDrawingOpts = ['lego', 'colz', 'args', 'coly'];
      assert.deepStrictEqual(drawingOptions, expDrawingOpts);
    });

    it('should merge options on layoutShow and false ignoreDefaults field', async () => {
      const drawingOptions = await page.evaluate(() => {
        const tabObject = { ignoreDefaults: false, options: ['args', 'coly'] };
        const objectRemoteData = { payload: { qcObject: { fOption: 'lego colz' } } };
        return window.model.object.generateDrawingOptions(tabObject, objectRemoteData);
      });

      const expDrawingOpts = ['lego', 'colz', 'args', 'coly'];
      assert.deepStrictEqual(drawingOptions, expDrawingOpts);
    });

    it('should ignore default options on layoutShow and true ignoreDefaults field', async () => {
      const drawingOptions = await page.evaluate(() => {
        const tabObject = { ignoreDefaults: true, options: ['args', 'coly'] };
        const objectRemoteData = { payload: { qcObject: { fOption: 'lego colz' } } };
        return window.model.object.generateDrawingOptions(tabObject, objectRemoteData);
      });

      const expDrawingOpts = ['args', 'coly'];
      assert.deepStrictEqual(drawingOptions, expDrawingOpts);
    });

    it('should use only default options on objectTree', async () => {
      const drawingOptions = await page.evaluate(() => {
        window.model.page = 'objectTree';
        const tabObject = { options: ['args', 'coly'] };
        const objectRemoteData = { payload: { qcObject: { fOption: 'lego colz' } } };
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
        const tabObject = { options: ['args', 'coly'] };
        const objectRemoteData = { payload: { qcObject: { fOption: 'lego colz', displayHints: 'hint hint2', drawingOptions: 'option option2' } } };
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
        const tabObject = { options: ['args', 'coly'] };
        const objectRemoteData = { payload: { qcObject: { fOption: 'lego colz' } } };
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
        const tabObject = { options: ['args', 'coly'] };
        const objectRemoteData = { payload: { qcObject: { fOption: 'lego colz' } } };
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
        window.model.layout.requestedLayout.payload.tabs = [
          {
            id: '5aba4a059b755d517e76eb61',
            name: 'SDD',
            objects: [
              {
                id: '5aba4a059b755d517e76ef54',
                options: ['gridx'],
                name: 'DAQ01/EquipmentSize/CPV/CPV',
                x: 0,
                y: 0,
                w: 1,
                h: 1,
              },
            ],
          },
        ];
        const objectRemoteData = { payload: { qcObject: { fOption: 'lego colz' } } };
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
        window.model.layout.requestedLayout.payload.tabs = [
          {
            id: '5aba4a059b755d517e76eb61',
            name: 'SDD',
            objects: [
              {
                id: '5aba4a059b755d517e76ef54',
                options: ['gridx'],
                ignoreDefaults: false,
                name: 'DAQ01/EquipmentSize/CPV/CPV',
                x: 0,
                y: 0,
                w: 1,
                h: 1,
              },
            ],
          },
        ];
        const objectRemoteData = { payload: { qcObject: { fOption: 'lego colz' } } };
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
        window.model.layout.requestedLayout.payload.tabs = [
          {
            id: '5aba4a059b755d517e76eb61',
            name: 'SDD',
            objects: [
              {
                id: '5aba4a059b755d517e76ef54',
                options: ['gridx'],
                ignoreDefaults: true,
                name: 'DAQ01/EquipmentSize/CPV/CPV',
                x: 0,
                y: 0,
                w: 1,
                h: 1,
              },
            ],
          },
        ];
        const objectRemoteData = { payload: { qcObject: { fOption: 'lego colz' } } };
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
    if (!this.ok) {
      throw new Error('something went wrong');
    }
  });

  after(async () => {
    await browser.close();
    console.log('---------------------------------------------');
    console.log('Output of server logs for the previous tests:');
    console.log(subprocessOutput);
    subprocess.kill();
  });
});
