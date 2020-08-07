const puppeteer = require('puppeteer');
const assert = require('assert');
const config = require('./test-config.js');
const {spawn} = require('child_process');
const {JwtToken} = require('@aliceo2/web-ui');

// APIs:
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
// https://mochajs.org/

// Tips:
// Network and rendering can have delays this can leads to random failures
// if they are tested just after their initialization.

describe('InfoLogger', function() {
  let browser;
  let page;
  let subprocess; // web-server runs into a subprocess
  let subprocessOutput = '';
  this.timeout(30000);
  this.slow(1000);
  const baseUrl = 'http://' + config.http.hostname + ':' + config.http.port + '/';

  const jwt = new JwtToken(config.jwt);
  const testToken = jwt.generateToken(1, 'test', 1);

  before(async () => {
    // Start web-server in background
    subprocess = spawn('node', ['index.js', 'test/test-config.js'], {stdio: 'pipe'});
    subprocess.stdout.on('data', (chunk) => {
      subprocessOutput += chunk.toString();
    });
    subprocess.stderr.on('data', (chunk) => {
      subprocessOutput += chunk.toString();
    });

    // Start infologgerserver simulator
    require('./live-simulator/infoLoggerServer.js');

    // Start browser to test UI
    browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    page = await browser.newPage();
  });

  it('should load first page "/"', async () => {
    // try many times until backend server is ready
    for (let i = 0; i < 10; i++) {
      try {
        await page.goto(baseUrl, {waitUntil: 'networkidle0'});
        break; // connection ok, this test passed
      } catch (e) {
        if (e.message.includes('net::ERR_CONNECTION_REFUSED')) {
          await new Promise((done) => setTimeout(done, 500));
          continue; // try again
        }
        throw e;
      }
    }
  });

  it('should have redirected to default page "/?q={"severity":{"in":"I W E F"}}"', async function() {
    await page.goto(baseUrl, {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    const search = decodeURIComponent(location.search);

    assert.deepStrictEqual(search, '?q={"severity":{"in":"I W E F"}}');
  });

  describe('User Actions', async () => {
    describe('User is anonymous', async () => {
      it('should have a button in action dropdown button to view info about the framework', async () => {
        const profileMenuItem = await page.evaluate(() => {
          const title = document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(2)').title;
          const text = document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(2)').innerText;
          return {title: title, text: text};
        });
        assert.strictEqual(profileMenuItem.title, 'Show/Hide details about the framework');
        assert.strictEqual(profileMenuItem.text, 'About');
      });

      it('should not have a button in action dropdown button to save the profile', async () => {
        const profileMenuItem = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(3)'));
        assert.strictEqual(profileMenuItem, null);
      });
    });

    describe('User is NOT anonymous', async () => {
      it('should have a button in action dropdown button to save user profile', async () => {
        await page.goto(baseUrl + `?personid=1&name=test&token=${testToken}`, {waitUntil: 'networkidle0'});
        const profileMenuItem = await page.evaluate(() => {
          const title = document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(3)').title;
          const text = document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(3)').innerText;
          return {title: title, text: text};
        });
        assert.strictEqual(profileMenuItem.title, 'Save the columns size and visibility as your profile');
        assert.strictEqual(profileMenuItem.text, 'Save Profile');
      });

      it('successfully save the profile of the user when pressed the "Save Profile" menu-item', async () => {
        await page.evaluate(() => {
          document.querySelector('body > div:nth-child(2) > div > header:nth-child(2) > table > tbody > tr > td > button').click();
          document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(3)').click();
        });
        await page.waitFor(200);

        const actionDropdownClosed = await page.evaluate(() => window.model.accountMenuEnabled);
        assert.ok(!actionDropdownClosed);
      });

      it('should have a button in action dropdown button to view info about the framework', async () => {
        const profileMenuItem = await page.evaluate(() => {
          const title = document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(2)').title;
          const text = document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(2)').innerText;
          return {title: title, text: text};
        });
        assert.strictEqual(profileMenuItem.title, 'Show/Hide details about the framework');
        assert.strictEqual(profileMenuItem.text, 'About');
      });

      it('should successfully load profile saved for user when accessing the page', async () => {
        await page.goto(baseUrl + `?personid=1&name=test&token=${testToken}`, {waitUntil: 'networkidle0'});
        const userProfile = await page.evaluate(() => {
          window.model.table.colsHeader.date.size = 'cell-xl';
          document.querySelector('body > div:nth-child(2) > div > header:nth-child(2) > table > tbody > tr > td > button').click();
          document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(3)').click();
          return window.model.userProfile;
        });
        page.waitFor(200);
        assert.ok(!userProfile.payload.content.colsHeader.date.visible);
      });
    });
  });

  describe('LogFilter', async () => {
    it('should succesfully load a page with profile in the URI', async function() {
      await page.goto(baseUrl + "?profile=physicist", {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      const search = decodeURIComponent(location.search);

      // for now, check if redirected to default page
      assert.deepStrictEqual(search, '?q={"severity":{"in":"I W E F"}}');
    });

    it('should update column headers based on profile when passed in the URI', async () => {
      const expectedColumns = {
        date: {size: 'cell-m', visible: false},
        time: {size: 'cell-m', visible: true},
        hostname: {size: 'cell-m', visible: false},
        rolename: {size: 'cell-m', visible: true},
        pid: {size: 'cell-s', visible: false},
        username: {size: 'cell-m', visible: false},
        system: {size: 'cell-s', visible: true},
        facility: {size: 'cell-m', visible: true},
        detector: {size: 'cell-s', visible: false},
        partition: {size: 'cell-m', visible: false},
        run: {size: 'cell-s', visible: false},
        errcode: {size: 'cell-s', visible: true},
        errline: {size: 'cell-s', visible: false},
        errsource: {size: 'cell-m', visible: false},
        message: {size: 'cell-xl', visible: true}
      };

      const columns = await page.evaluate(() => {
        return window.model.table.colsHeader;
      });

      assert.deepStrictEqual(columns, expectedColumns);
    });

    it('should update filters based on profile when passed in the URI', async () => {
      // for now check if the filters are reset once the profile is passed 
      const expectedParams = '?q={%22severity%22:{%22in%22:%22I%20W%20E%20F%22}}';
   
      const searchParams = await page.evaluate(() => {
        const params = {profile:'physicist'};
        window.model.parseLocation(params);
        return window.location.search;
      });

      await page.waitForFunction(`window.model.notification.state === 'shown'`);
      await page.waitForFunction(`window.model.notification.type === 'warning'`);
      await page.waitForFunction(`window.model.notification.message === "Cannot find profile PHYSICIST, default profile used instead"`);

      assert.strictEqual(searchParams, expectedParams);
    });

    it('should reset filters and show warning message when profile and filters are passed', async () => {
      // wait until the previous notification is hidden
      await page.waitForFunction(`window.model.notification.state === 'hidden'`);
      const expectedParams = '?q={%22severity%22:{%22in%22:%22I%20W%20E%20F%22}}';
      const searchParams = await page.evaluate(() => {
        const params ={profile: "physicist", q: '"severity":{"in":"I W E F"}}'};
        window.model.parseLocation(params);
        return window.location.search;
      });

      await page.waitForFunction(`window.model.notification.state === 'shown'`);
      await page.waitForFunction(`window.model.notification.type === 'warning'`);
      await page.waitForFunction(`window.model.notification.message === "URL can contain only filters or profile, not both"`);
      assert.strictEqual(searchParams, expectedParams);
    });

    it('should update URI with new encoded criteria', async () => {
      /* eslint-disable max-len */
      const decodedParams = '?q={"hostname":{"match":"%ald_qdip01%"},"severity":{"in":"I W E F"}}';
      const expectedParams = '?q={%22hostname%22:{%22match%22:%22%25ald_qdip01%25%22},%22severity%22:{%22in%22:%22I%20W%20E%20F%22}}';
      /* eslint-enable max-len */
      const searchParams = await page.evaluate(() => {
        window.model.log.filter.setCriteria('hostname', 'match', '%ald_qdip01%');
        window.model.updateRouteOnModelChange();
        return window.location.search;
      });

      assert.deepStrictEqual(searchParams, expectedParams);
      assert.deepStrictEqual(decodeURI(searchParams), decodedParams);
    });

    it('should parse dates in format DD/MM/YY', async () => {
      // default Geneva time
      const $since = await page.evaluate(() => {
        window.model.log.filter.setCriteria('timestamp', 'since', '01/02/04');
        return window.model.log.filter.criterias.timestamp.$since.toISOString();
      });

      assert.deepStrictEqual($since, '2004-01-31T23:00:00.000Z');
    });

    it('should parse dates in format DD/MM/YYTHH:MM', async () => {
      // default Geneva time
      const $since = await page.evaluate(() => {
        window.model.log.filter.setCriteria('timestamp', 'since', '01/02/04T00:00');
        return window.model.log.filter.criterias.timestamp.$since.toISOString();
      });

      assert.deepStrictEqual($since, '2004-01-31T23:00:00.000Z');
    });

    it('should parse numbers to integers', async () => {
      const level = await page.evaluate(() => {
        window.model.log.filter.setCriteria('level', 'max', 12);
        return window.model.log.filter.criterias.level;
      });

      assert.deepStrictEqual(level.$max, 12);
      assert.deepStrictEqual(level.max, 12);
    });

    it('should parse empty keyword to null', async () => {
      const $match = await page.evaluate(() => {
        window.model.log.filter.setCriteria('pid', 'match', '');
        return window.model.log.filter.criterias.pid.$match;
      });

      assert.deepStrictEqual($match, null);
    });

    it('should parse keyword', async () => {
      const $match = await page.evaluate(() => {
        window.model.log.filter.setCriteria('pid', 'match', '1234');
        return window.model.log.filter.criterias.pid.$match;
      });

      assert.deepStrictEqual($match, '1234');
    });

    it('should parse no keywords to null', async () => {
      const $in = await page.evaluate(() => {
        window.model.log.filter.setCriteria('pid', 'in', '');
        return window.model.log.filter.criterias.pid.$in;
      });

      assert.deepStrictEqual($in, null);
    });

    it('should parse keywords to array', async () => {
      const $in = await page.evaluate(() => {
        window.model.log.filter.setCriteria('pid', 'in', '123 456');
        return window.model.log.filter.criterias.pid.$in;
      });

      assert.deepStrictEqual($in.length, 2);
      assert.deepStrictEqual($in, ['123', '456']);
    });

    it('should reset filters and set them again', async () => {
      const criterias = await page.evaluate(() => {
        window.model.log.filter.resetCriterias();
        window.model.log.filter.setCriteria('level', 'max', 21);
        return window.model.log.filter.criterias;
      });

      assert.deepStrictEqual(criterias.pid.match, '');
      assert.deepStrictEqual(criterias.pid.$match, null);
      assert.deepStrictEqual(criterias.level.max, 21);
      assert.deepStrictEqual(criterias.level.$max, 21);
      assert.deepStrictEqual(criterias.timestamp.since, '');
      assert.deepStrictEqual(criterias.timestamp.$since, null);
      assert.deepStrictEqual(criterias.severity.in, 'I W E F');
      assert.deepStrictEqual(criterias.severity.$in, ['W', 'I', 'E', 'F']);
    });

  });

  describe('Live mode', async () => {
    it('can be activated because it is configured and simulator is started', async () => {
      const activeMode = await page.evaluate(() => {
        window.model.log.liveStart();
        return window.model.log.activeMode;
      });

      assert.deepStrictEqual(activeMode, 'Running');
    });

    it('cannot be activated twice', async () => {
      const thrown = await page.evaluate(() => {
        try {
          window.model.log.liveStart();
          return false;
        } catch (e) {
          return true;
        }
      });

      assert.deepStrictEqual(thrown, true);
    });

    it('should have filled some logs via WS with the level "debug"', async () => {
      // check level is still 21 after LogFilter tests
      const criterias = await page.evaluate(() => {
        window.model.log.filter.resetCriterias();
        window.model.log.filter.setCriteria('level', 'max', 21);
        return window.model.log.filter.criterias;
      });

      assert.deepStrictEqual(criterias.level.max, 21);
      assert.deepStrictEqual(criterias.level.$max, 21);

      // Wait for logs and count them (2-3 maybe, it's random)
      await page.waitFor(1500); // simulator is set to ~100ms per log
      const list = await page.evaluate(() => {
        return window.model.log.list;
      });
      assert.deepStrictEqual(!!list.length, true);
    });

    it('should filter messages based on `hostname` matching `aldaqecs01-v1` from live -> paused -> live', async () => {
      await page.evaluate(() => window.model.log.liveStop('Paused'));
      await page.evaluate(() => {
        window.model.log.filter.resetCriterias();
        window.model.log.filter.setCriteria('hostname', 'match', 'aldaqecs01-v1');
      });
      await page.evaluate(() => window.model.log.liveStart());
      await page.waitFor(7000);
      const list = await page.evaluate(() => window.model.log.list);
      await page.waitFor(1000);
      const isHostNameMatching = list.map((element) => element.hostname).every((hostname) => hostname === 'aldaqecs01-v1');
      assert.ok(list.length > 0);
      assert.ok(isHostNameMatching);
    });

    it('should filter messages based on `hostname` excluding `aldaqdip01` from live -> query -> live', async () => {
      await page.evaluate(() => window.model.log.liveStop('Query'));
      await page.evaluate(() => {
        window.model.log.filter.resetCriterias();
        window.model.log.filter.setCriteria('hostname', 'exclude', 'aldaqdip01');
      });
      await page.evaluate(() => window.model.log.liveStart());
      await page.waitFor(3000);
      const list = await page.evaluate(() => window.model.log.list);
      const isHostNameMatching = list.map((element) => element.hostname).every((hostname) => hostname !== 'aldaqdip01');

      assert.ok(list.length > 0);
      assert.ok(isHostNameMatching);
    });

    it('should filter messages based on SQL Wildcards `hostname` excluding `%ldaqdip%` and username matching `a_iceda_` without changing state of live mode', async () => {
      await page.evaluate(() => window.model.log.filter.resetCriterias());
      await page.evaluate(() => {
        window.model.log.setCriteria('hostname', 'exclude', '%ldaqdip%');
        window.model.log.setCriteria('username', 'match', 'a_iceda_');
        window.model.log.empty();
      });
      await page.waitFor(3000);
      const list = await page.evaluate(() => window.model.log.list);
      const isHostNameMatching = list.map((element) => element.hostname).every((hostname) => !new RegExp('.*ldaqdip.*').test(hostname));
      const isUserNameMatching = list.map((element) => element.username).every((username) => new RegExp('a.iceda.').test(username));

      assert.ok(list.length > 0);
      assert.ok(isHostNameMatching);
      assert.ok(isUserNameMatching);
    });

    it('successfully show indicator when user double pressed the log row', async () => {
      const tableRow = await page.$('body > div:nth-child(2) > div:nth-child(2) > main > div > div > div > table > tbody > tr');
      await tableRow.click({clickCount: 2});
      await page.waitFor(200);
      const indicatorOpen = await page.evaluate(() => window.model.inspectorEnabled);
      assert.ok(indicatorOpen);
    });

    it('should go to mode live in paused state', async () => {
      const activeMode = await page.evaluate(() => {
        window.model.log.liveStop('Paused');
        return window.model.log.activeMode;
      });

      assert.deepStrictEqual(activeMode, 'Paused');
    });

    it('should go to mode query', async () => {
      const activeMode = await page.evaluate(() => {
        window.model.log.liveStart();
        window.model.log.liveStop('Query');
        return window.model.log.activeMode;
      });

      assert.deepStrictEqual(activeMode, 'Query');
    });

    it('should go to mode query if mode not specified', async () => {
      const activeMode = await page.evaluate(() => {
        window.model.log.liveStart();
        window.model.log.liveStop();
        return window.model.log.activeMode;
      });

      assert.deepStrictEqual(activeMode, 'Query');
    });
  });

  describe('Query mode', () => {
    it('should fail because it is not configured', async () => {
      try {
        await page.evaluate(async () => {
          return await window.model.log.query();
        });
        assert.fail();
      } catch (e) {
        // code failed, so it is a successful test
      }
    });
  });

  describe('utils.js', async () => {
    it('can be injected', async () => {
      const watchDogInjection = page.waitForFunction('window.utils');
      await page.evaluate(() => {
        const script = document.createElement('script');
        script.type = 'module';
        const content = document.createTextNode('import * as utils from "/common/utils.js"; window.utils = utils;');
        script.appendChild(content);
        document.getElementsByTagName('head')[0].appendChild(script);
      });
      await watchDogInjection;
    });

    it('has a callRateLimiter to limit function calls per window', async () => {
      let counter = await page.evaluate(() => {
        window.testCounter = 0;
        window.testFunction = window.utils.callRateLimiter(() => window.testCounter++, 100);
        window.testFunction();
        window.testFunction();
        window.testFunction(); // 3 calls but counter will increase by 2 only at the end
        return window.testCounter;
      });
      assert.deepStrictEqual(counter, 1);

      await page.waitFor(200);
      counter = await page.evaluate(() => {
        return window.testCounter;
      });
      assert.deepStrictEqual(counter, 2);
    });
  });

  after(async () => {
    await browser.close();
    console.log('---------------------------------------------');
    console.log('Output of server logs for the previous tests:');
    console.log('---------------------------------------------');
    console.log(subprocessOutput);
    console.log('---------------------------------------------');
    subprocess.kill();
  });
});

