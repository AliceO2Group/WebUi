/* eslint-disable */

const puppeteer = require('puppeteer');
const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const port = 8085;

let server;
let browser;
let page;

// APIs:
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
// https://mochajs.org/

// Tips:
// Network and rendering can have delays this can leads to random failures
// if they are tested just after their initialization.

describe('Framework Frontend', function() {
  this.timeout(5000);
  this.slow(1000);

  // Start a web server to serve frontend
  // We don't use backend to avoid side effects from it
  before(function(done) {
    server = http.createServer((request, response) => {
      // console.log(request.url);
      if (request.url === '/index.html') {
        return response.end(`<script type="module">
          import * as framework from '/js/src/index.js';
          Object.assign(window, framework);
          window.frameworkLoaded = true;
        </script>`);
      } else if (request.url === '/api/ok.json?token=TOKEN') {
        response.setHeader('Content-type', 'application/json');
        return response.end(`{"ok": "${request.method}"}`);
      } else {
        fs.readFile(path.join(__dirname, '..', request.url), (error, content) => {
          if (error) {
            response.statusCode = 404;
            response.end(`File ${request.url} not found!`);
            return;
          }
          response.setHeader('Content-type', 'text/javascript');
          response.end(content);
        });
      }
    });

    server.listen(port, (err) => {
      if (err) {
        throw err;
      }
      done();
    })
  });

  // Start browser to test UI
  before(async function() {
    browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
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
    await page.goto(`http://localhost:${port}/index.html`, {waitUntil: 'networkidle0'});
    const framework = await page.evaluate(() => window.frameworkLoaded);
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

    it('updates previous tag content', async() => {
      const result = await page.evaluate(() => {
        render(window.document.body, h('a', {href: 'http://google.com/go'}, 'click me 2'));
        return window.document.body.innerHTML;
      });
      assert.strictEqual(result, '<a href="http://google.com/go">click me 2</a>');
    });

    it('updates previous tag but keep element', async() => {
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
      await page.evaluate(async () => {
        window.router.go('?personid=PERSONID&name=NAME&token=TOKEN', true, true);
        sessionService.loadAndHideParameters();
        window.result = sessionService.get().token;
      });
      await page.waitForFunction(`window.result === 'TOKEN'`);
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

  after(function() {
    server.close();
  });
});
