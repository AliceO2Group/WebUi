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

/* eslint-disable */

const puppeteer = require('puppeteer');
const assert = require('assert');
const {spawn} = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const port = 8085;

let browser;
let page;

// APIs:
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
// https://mochajs.org/

// Tips:
// Network and rendering can have delays this can leads to random failures
// if they are tested just after their initialization.

describe('Framework Frontend', function() {
  let subprocess; // web-server runs into a subprocess
  let subprocessOutput = '';
  this.timeout(10000);
  this.slow(1000);

  // Start browser to test UI
  before(async function() {
    // Start web-server in background
    subprocess = spawn('node', ['Frontend/test/index-test.js'], {stdio: 'pipe'});
    subprocess.stdout.on('data', (chunk) => {
      subprocessOutput += chunk.toString();
    });
    subprocess.stderr.on('data', (chunk) => {
      subprocessOutput += chunk.toString();
    });

    browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: false});
    page = await browser.newPage();
    page.on('requestfailed', (request) => {
      console.error(`Navigator failed to load ${request.url()}`);
    });
    page.on('console', (message) => {
      if (message._type === 'error') {
        console.error(`Navigator got an error: ${message._text}`);
      } else {
        console.log(`Message from navigator: ${message._text}`);
      }
    });
  });

  it('should be loaded by browser as a module', async function() {
    // frameworkLoaded is affected in index.html sent by server
    await page.goto(`http://localhost:${port}`, {waitUntil: 'networkidle0'});
    const framework = await page.evaluate(() => window.frameworkLoaded);
    await page.waitForTimeout(20000)
    if (!framework) {
      throw new Error(`Navigator failed to load framework`);
    }
  });

  describe('template engine', function() {
    it('creates simple tag with text', async function() {
      const result = await page.evaluate(() => {
        render(window.document.body, h('div', 'hello'));
        return window.document.body.innerHTML;
      });

      assert.strictEqual(result, '<div>hello</div>');
    });
    it('creates a tag with classes by selector', async function() {
      const result = await page.evaluate(() => {
        render(window.document.body, h('div.highlight.bold', 'hello'));
        return window.document.body.innerHTML;
      });

      assert.strictEqual(result, '<div class="highlight bold">hello</div>');
    });

    it('creates a tag with attributes and text', async () => {
      const result = await page.evaluate(() => {
        render(window.document.body, h('a', {href: 'http://google.com'}, 'click me'));
        window.saveElement = window.document.body.firstElementChild;
        return window.document.body.innerHTML;
      });
      assert.strictEqual(result, '<a href="http://google.com">click me</a>');
    });

    it('updates previous tag content', async () => {
      const result = await page.evaluate(() => {
        render(window.document.body, h('a', {href: 'http://google.com/go'}, 'click me 2'));
        return window.document.body.innerHTML;
      });
      assert.strictEqual(result, '<a href="http://google.com/go">click me 2</a>');
    });

    it('updates previous tag but keep element', async () => {
      const result = await page.evaluate(() => {
        return window.saveElement === window.document.body.firstElementChild;
      });
      assert.strictEqual(result, true);
    });

    it('creates a deep DOM tree (with vnode array)', async () => {
      const result = await page.evaluate(() => {
        render(window.document.body, h('ul', [h('li', 1), h('li', 1)]));
        return window.document.body.innerHTML;
      });
      assert.strictEqual(result, '<ul><li>1</li><li>1</li></ul>');
    });

    it('creates a deep DOM tree (with vnode arguments)', async () => {
      const result = await page.evaluate(() => {
        render(window.document.body, h('ul', h('li', 1), h('li', 1)));
        return window.document.body.innerHTML;
      });
      assert.strictEqual(result, '<ul><li>1</li><li>1</li></ul>');
    });

    it('has hook oncreate', async () => {
      const result = await page.evaluate(() => {
        render(window.document.body, h('div', {
          oncreate: (vnode) => vnode.dom.innerHTML = 'world'
        }, 'hello'));
        return window.document.body.innerHTML;
      });
      assert.strictEqual(result, '<div>world</div>');
    });

    it('has hook onupdate', async () => {
      const result = await page.evaluate(() => {
        render(window.document.body, h('div', {
          onupdate: (vnode) => vnode.dom.innerHTML = 'world2',
        }, 'hello'));
        return window.document.body.innerHTML;
      });
      assert.strictEqual(result, '<div>world2</div>');
    });

    it('has hook onremove', async () => {
      const result = await page.evaluate(() => {
        let output = '';
        render(window.document.body, h('div', {
          onremove: (vnode) => output = 'world3',
        }, 'hello'));
        render(window.document.body, h('p'));
        return output;
      });
      assert.strictEqual(result, 'world3');
    });

    it('listens to click event', async () => {
      const result = await page.evaluate(() => {
        let output = '';
        render(window.document.body, h('button', {onclick: () => output = 'clicked'}));
        window.document.body.firstElementChild.click();
        return output;
      });
      assert.strictEqual(result, 'clicked');
    });

    it('can be mounted', async () => {
      await page.evaluate(() => {
        const model = new Observable();
        const view = (model) => h('h1.title', `hello ${model.name}`);
        mount(document.body, view, model);
        model.name = 'Joueur du Grenier';
        model.notify();
        model.name = 'André Brahic';
        model.notify();
      });
      // wait template engine to render model
      await page.waitForFunction(`window.document.body.innerHTML === '<h1 class="title">hello André Brahic</h1>'`);
    });
  });

  describe('Observable class', function() {
    let handler = () => null;

    it('can be instanciated', async () => {
      await page.evaluate(() => {
        window.instance = new Observable();
      });
    });

    it('can add a listener to notifications', async () => {
      const result = await page.evaluate(() => {
        window.output = '';
        window.handler = handler = () => window.output = 'handled';
        window.instance.observe(window.handler);
        window.instance.notify();
        return window.output;
      });
      assert.strictEqual(result, 'handled');
    });

    it('can add a listener to notifications of sub-model', async () => {
      const result = await page.evaluate(() => {
        window.output = '';
        window.instance2 = new Observable();
        window.instance2.bubbleTo(window.instance);
        window.instance2.notify();
        return window.output;
      });
      assert.strictEqual(result, 'handled');
    });
  });

  describe('QueryRouter class', function() {
    it('notifices when route has changed', async () => {
      await page.evaluate(() => {
        window.notification = '';
        const router = new QueryRouter();
        router.observe(() => {
          window.notification = router.params.page;
        });
        router.go('?page=list', true); // replace current URL to avoid loosing Framework injection
        window.router = router; // save for later use in tests
      });
      await page.waitForFunction(`window.notification === 'list'`);
    });
  });

  describe('Notification class', function() {
    before('can be instanciated', async () => {
      await page.evaluate(() => {
        window.notification = new Notification();
      });
    });

    it('is hidden at first', async () => {
      // await page.evaluate(() => {
      //   window.notification = '';
      //   const router = new QueryRouter();
      //   router.observe(() => {
      //     window.notification = router.params.page;
      //   });
      //   router.go('?page=list', true); // replace current URL to avoid loosing Framework injection
      //   window.router = router; // save for later use in tests
      // });
      await page.waitForFunction(`window.notification.state === 'hidden'`);
    });

    it('is shown on new success message', async () => {
      await page.evaluate(() => {
        window.notification.show('Warp Drive Mr. Scott', 'success', 4000);
      });
      await page.waitForFunction(`window.notification.state === 'shown'`);
      await page.waitForFunction(`window.notification.type === 'success'`);
    });

    it('stays for 4 seconds', async () => {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      await page.waitForFunction(`window.notification.state === 'hidden'`);
    });
  });

  describe('Loader class (and fetchClient, sessionService)', function() {
    it('loads session token', async () => {
      const res = await page.evaluate(async () => {
        window.router.go('/');
        return window.sessionService.session;
      });
      assert.ok(res !== undefined);
    });

    it('sends POST to web server', async () => {
      await page.evaluate(async () => {
        const loader = new Loader();
        const {result, ok, status} = await loader.post('/api/ok.json');
        if (!ok) {
          throw new Error(`unable to send request to server, got status ${status}`);
        }
        window.result = result.ok;
      });
      await page.waitForFunction(`window.result === 'POST'`);
    });

    it('sends GET to web server', async () => {
      await page.evaluate(async () => {
        const loader = new Loader();
        const {result, ok, status} = await loader.get('/api/ok.json');
        if (!ok) {
          throw new Error(`unable to send request to server, got status ${status}`);
        }
        window.result = result.ok;
      });
      await page.waitForFunction(`window.result === 'GET'`);
    });
  });

  describe('BrowserStorage class', function() {
    it('should successfully create a BrowserStorage instance', async () => {
      await page.evaluate(async () => {
        const storage = new BrowserStorage();
      });
    });

    it('should successfully set (key,value) in localStorage & sessionStorage', async () => {
      const storage = await page.evaluate(async () => {
        const storage = new BrowserStorage('TEST');
        storage.setLocalItem('local', {value: 'localValue'});
        storage.setLocalItem('localRemove', {value: 'localValue'});
        storage.setLocalItem('localClear', {value: 'localValue'});
        storage.setSessionItem('session', {value: 'sessionValue'});
        storage.setSessionItem('sessionClear', {value: 'sessionValue'});
        storage.setSessionItem('sessionRemove', {value: 'sessionValue'});

        const expectedLocalValue = JSON.parse(window.localStorage.getItem('TEST-local'));
        const expectedSessionValue = JSON.parse(window.sessionStorage.getItem('TEST-session'));
        return [expectedLocalValue, expectedSessionValue];
      });
      assert.deepStrictEqual(storage[0], {value: 'localValue'});
      assert.deepStrictEqual(storage[1], {value: 'sessionValue'});
    });

    it('should successfully return false and not set (key, value) when using bad key', async () => {
      const isSet = await page.evaluate(async () => {
        const storage = new BrowserStorage('TEST');
        const emptyKey = storage.setLocalItem('', {value: 'localValue'});
        const undefinedKey = storage.setLocalItem(undefined, {value: 'localValue'});
        const nullKey = storage.setLocalItem(null, {value: 'localValue'});
        const whiteSpaceKey = storage.setLocalItem('  ', {value: 'localValue'});
        const nonStringKey = storage.setLocalItem(22, {value: 'localValue'});
        return emptyKey || undefinedKey || nullKey || whiteSpaceKey || nonStringKey;
      });
      assert.deepStrictEqual(isSet, false);
    });

    it('should successfully return false and not set (key, value) when using bad value', async () => {
      const isSet = await page.evaluate(async () => {
        const storage = new BrowserStorage('TEST');
        return storage.setLocalItem('key', undefined);
      });
      assert.deepStrictEqual(isSet, false);
    });

    it('should successfully retrieve item as JSON from local & session storage based on key', async () => {
      const storage = await page.evaluate(async () => {
        const storage = new BrowserStorage('TEST');
        const localValue = storage.getLocalItem('local');
        const sessionValue = storage.getSessionItem('session');
        return [localValue, sessionValue];
      });
      assert.deepStrictEqual(storage[0].value, 'localValue');
      assert.deepStrictEqual(storage[1].value, 'sessionValue');
    });

    it('should successfully return null if key does not exist', async () => {
      const storage = await page.evaluate(async () => {
        const storage = new BrowserStorage('TEST');
        const localValue = storage.getLocalItem('no-key');
        const sessionValue = storage.getSessionItem('no-key');
        return [localValue, sessionValue];
      });
      assert.deepStrictEqual(storage[0], null);
      assert.deepStrictEqual(storage[1], null);
    });

    it('should successfully remove (key, value) from local & session storage based on key', async () => {
      const storage = await page.evaluate(async () => {
        const storage = new BrowserStorage('TEST');
        const localValue = storage.getLocalItem('local');
        const sessionValue = storage.getSessionItem('session');
        storage.removeLocalItem('localRemove');
        storage.removeSessionItem('sessionRemove');
        const localRemoved = storage.getLocalItem('localRemove');
        const sessionRemoved = storage.getSessionItem('sessionRemove');
        return [localValue, localRemoved, sessionValue, sessionRemoved];
      });
      assert.deepStrictEqual(storage, [{value: 'localValue'}, null, {value: 'sessionValue'}, null]);
    });

    it('should successfully clear local & session storage', async () => {
      const storage = await page.evaluate(async () => {
        const storage = new BrowserStorage('TEST');
        const localValue = window.localStorage.length;
        const sessionValue = window.localStorage.length;
        storage.clearLocalStorage();
        storage.clearSessionStorage();
        const localEmpty = window.localStorage.length;
        const sessionEmpty = window.localStorage.length;
        return [localValue, localEmpty, sessionValue, sessionEmpty];
      });
      assert.deepStrictEqual(storage, [2, 0, 2, 0]);
    });
  });

  after(async () => {
    await browser.close();
    console.log('---------------------------------------------');
    console.log('Output of server logs for the previous tests:');
    console.log(subprocessOutput);
    subprocess.kill();
  });
});
