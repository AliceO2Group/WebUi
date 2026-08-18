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

const assert = require('assert');
const test = require('../mocha-index');

describe('Filter actions test-suite', async () => {
  let baseUrl = null;
  let page = null;

  before(async () => {
    ({ page } = test);
    ({ baseUrl } = test.helpers);
  });

  // "physicist" is not a distinct stored profile; the server returns defaultCriterias for any name
  it('should succesfully load a page with profile in the URI', async () => {
    await page.goto(`${baseUrl}?profile=physicist`, { waitUntil: 'networkidle0' });
    const location = await page.evaluate(() => window.location);
    const search = decodeURIComponent(location.search);

    // for now, check if redirected to default page
    assert.strictEqual(search, '?q={"severity":{"in":"I W E F"},"level":{"max":1}}');
  });

  it('should update column headers based on profile when passed in the URI', async () => {
    const expectedColumns = {
      date: { size: 'cell-m', visible: false },
      time: { size: 'cell-m', visible: true },
      hostname: { size: 'cell-m', visible: true },
      rolename: { size: 'cell-m', visible: false },
      pid: { size: 'cell-s', visible: false },
      username: { size: 'cell-m', visible: false },
      system: { size: 'cell-s', visible: true },
      facility: { size: 'cell-m', visible: true },
      detector: { size: 'cell-s', visible: true },
      partition: { size: 'cell-m', visible: true },
      run: { size: 'cell-s', visible: true },
      errcode: { size: 'cell-s', visible: false },
      errline: { size: 'cell-s', visible: false },
      errsource: { size: 'cell-m', visible: false },
      message: { size: 'cell-xl', visible: true },
    };

    const columns = await page.evaluate(() => window.model.table.colsHeader);

    assert.deepStrictEqual(columns, expectedColumns);
  });

  it('should initialize each criteria field with the expected operators', async () => {
    const operators = await page.evaluate(() => {
      window.model.log.filter.resetCriteria();
      const result = {};
      for (const [field, ops] of Object.entries(window.model.log.filter.criterias)) {
        result[field] = Object.keys(ops);
      }
      return result;
    });

    const TEXT_OPS = [
      'match',
      '$match',
      'exclude',
      '$exclude',
      'emptyFor',
      '$emptyFor',
    ];

    assert.deepStrictEqual(operators, {
      timestamp: ['since', 'until', '$since', '$until'],
      hostname: TEXT_OPS,
      rolename: TEXT_OPS,
      pid: TEXT_OPS,
      username: TEXT_OPS,
      system: TEXT_OPS,
      facility: TEXT_OPS,
      detector: TEXT_OPS,
      partition: TEXT_OPS,
      run: TEXT_OPS,
      errcode: TEXT_OPS,
      errline: TEXT_OPS,
      errsource: TEXT_OPS,
      message: ['match', '$match', 'exclude', '$exclude'],
      severity: ['in', '$in'],
      level: ['max', '$max'],
    });
  });

  it('should throw when setting non-existent operator on a field', async () => {
    await assert.rejects(page.evaluate(() => window.model.log.filter.setCriteria('timestamp', 'emptyFor', 'match')));
    await assert.rejects(page.evaluate(() => window.model.log.filter.setCriteria('pid', 'in', false)));
    await assert.rejects(page.evaluate(() => window.model.log.filter.setCriteria('rolename', 'since', false)));
  });

  it('should update filters based on profile when passed in the URI', async () => {
    // for now check if the filters are reset once the profile is passed
    const expectedParams = '?q={%22severity%22:{%22in%22:%22I%20W%20E%20F%22},%22level%22:{%22max%22:1}}';

    const searchParams = await page.evaluate(() => {
      const params = { profile: 'physicist' };
      window.model.parseLocation(params);
      return window.location.search;
    });

    await page.waitForFunction('window.model.notification.state === \'shown\'');
    await page.waitForFunction('window.model.notification.type === \'success\'');
    await page.waitForFunction('window.model.notification.message === "The profile PHYSICIST was loaded successfully"');

    assert.strictEqual(searchParams, expectedParams);
  });

  it('should reset filters and show warning message when profile and filters are passed', async () => {
    // wait until the previous notification is hidden
    await page.waitForFunction('window.model.notification.state === \'hidden\'');
    const expectedParams = '?q={%22severity%22:{%22in%22:%22I%20W%20E%20F%22},%22level%22:{%22max%22:1}}';
    const searchParams = await page.evaluate(() => {
      const params = { profile: 'physicist', q: '"severity":{"in":"I W E F"}}' };
      window.model.parseLocation(params);
      return window.location.search;
    });

    await page.waitForFunction('window.model.notification.state === \'shown\'');
    await page.waitForFunction('window.model.notification.type === \'warning\'');
    await page.waitForFunction('window.model.notification.message === "URL can contain only filters or profile, not both"');
    assert.strictEqual(searchParams, expectedParams);
  });

  it('should redirect to default filters and show JSON parse error on malformed q in URI', async () => {
    const expectedDefaultParams = '?q={"severity":{"in":"I W E F"}}';

    const locationAndNotification = await page.evaluate(() => {
      const params = { q: '{"severity":{"in":"W I E F"' };
      window.model.parseLocation(params);
      return {
        search: window.location.search,
        notification: window.model.notification,
      };
    });

    assert.strictEqual(decodeURI(locationAndNotification.search), expectedDefaultParams);
    assert.strictEqual(locationAndNotification.notification.type, 'danger');
    // CI/CD runs on Chromium so this assertion is based on Chromium's JSON engine's error message
    assert.strictEqual(
      locationAndNotification.notification.message,
      'Invalid URL filter format: Expected \',\' or \'}\' after property value in JSON at position 27 (line 1 column 28)',
    );
  });

  it('should update URI with new encoded "match" criteria', async () => {
    const decodedParams = '?q={"hostname":{"match":"\\"%ald_qdip01%"},"severity":{"in":"I W E F"}}';
    const expectedParams = '?q={%22hostname%22:{%22match%22:%22%5C%22%25ald_qdip01%25%22},%22severity%22:{%22in%22:%22I%20W%20E%20F%22}}';
    const searchParams = await page.evaluate(() => {
      window.model.log.filter.setCriteria('hostname', 'match', '"%ald_qdip01%');
      window.model.updateRouteOnModelChange();
      return window.location.search;
    });

    assert.deepStrictEqual(searchParams, expectedParams);
    assert.deepStrictEqual(decodeURI(searchParams), decodedParams);
  });

  it('should update URI with new encoded "exclude" criteria', async () => {
    const decodedParams = '?q={"hostname":{"exclude":"\\"%ald_qdip01%"},"severity":{"in":"I W E F"}}';
    const expectedParams = '?q={%22hostname%22:{%22exclude%22:%22%5C%22%25ald_qdip01%25%22},%22severity%22:{%22in%22:%22I%20W%20E%20F%22}}';
    const searchParams = await page.evaluate(() => {
      window.model.log.filter.resetCriteria();
      window.model.log.filter.setCriteria('hostname', 'exclude', '"%ald_qdip01%');
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

    assert.strictEqual($since, '2004-01-31T23:00:00.000Z');
  });

  it('should parse dates in format DD/MM/YYTHH:MM', async () => {
    // default Geneva time
    const $since = await page.evaluate(() => {
      window.model.log.filter.setCriteria('timestamp', 'since', '01/02/04T00:00');
      return window.model.log.filter.criterias.timestamp.$since.toISOString();
    });

    assert.strictEqual($since, '2004-01-31T23:00:00.000Z');
  });

  it('should parse numbers to integers', async () => {
    const level = await page.evaluate(() => {
      window.model.log.filter.setCriteria('level', 'max', 12);
      return window.model.log.filter.criterias.level;
    });

    assert.strictEqual(level.$max, 12);
    assert.strictEqual(level.max, 12);
  });

  it('should parse empty keyword to null', async () => {
    const $match = await page.evaluate(() => {
      window.model.log.filter.setCriteria('pid', 'match', '');
      return window.model.log.filter.criterias.pid.$match;
    });

    assert.strictEqual($match, null);
  });

  it('should parse keyword', async () => {
    const $match = await page.evaluate(() => {
      window.model.log.filter.setCriteria('pid', 'match', '1234');
      return window.model.log.filter.criterias.pid.$match;
    });

    assert.strictEqual($match, '1234');
  });

  it('should parse no keywords to null', async () => {
    const $match = await page.evaluate(() => {
      window.model.log.filter.setCriteria('pid', 'match', '');
      return window.model.log.filter.criterias.pid.$match;
    });
    assert.strictEqual($match, null);
  });

  it('should parse keywords to array when using "in" operator', async () => {
    const $in = await page.evaluate(() => {
      window.model.log.filter.setCriteria('severity', 'in', 'I W E F');
      return window.model.log.filter.criterias.severity.$in;
    });
    assert.strictEqual($in.length, 4);
    assert.deepStrictEqual($in, ['I', 'W', 'E', 'F']);
  });

  it('should encode special characters correctly into the URL', async () => {
    const pidMatch = await page.evaluate(() => {
      window.model.log.filter.setCriteria('pid', 'match', 'a+b c %d #anchor & = héllo wörld 日本語');
      return window.model.log.filter.criterias.pid.$match;
    });

    assert.strictEqual(pidMatch, 'a+b c %d #anchor & = héllo wörld 日本語');

    const searchParams = await page.evaluate(() => {
      window.model.updateRouteOnModelChange();
      return window.location.search;
    });

    assert.ok(searchParams.includes('a%2Bb%20c%20%25d%20%23anchor%20%26%20%3D%20h%C3%A9llo%20w%C3%B6rld%20%E6%97%A5%E6%9C%AC%E8%AA%9E'));
  });

  it('should decode special characters correctly from the URL', async () => {
    await page.goto(`${baseUrl}?q={%22pid%22:{%22match%22:%22a%2Bb%20c%20%25d%20%23anchor%20%26%20%3D%20h%C3%A9llo%20w%C3%B6rld%20%E6%97%A5%E6%9C%AC%E8%AA%9E%22}}`, { waitUntil: 'networkidle0' });

    const pidMatch = await page.evaluate(() => window.model.log.filter.criterias.pid.$match);

    assert.strictEqual(pidMatch, 'a+b c %d #anchor & = héllo wörld 日本語');
  });

  it('should reset filters and set them again', async () => {
    const criterias = await page.evaluate(() => {
      window.model.log.filter.resetCriteria();
      window.model.log.filter.setCriteria('level', 'max', 21);
      return window.model.log.filter.criterias;
    });

    assert.strictEqual(criterias.pid.match, '');
    assert.strictEqual(criterias.pid.$match, null);
    assert.strictEqual(criterias.level.max, 21);
    assert.strictEqual(criterias.level.$max, 21);
    assert.strictEqual(criterias.timestamp.since, '');
    assert.strictEqual(criterias.timestamp.$since, null);
    assert.strictEqual(criterias.severity.in, 'I W E F');
    assert.deepStrictEqual(criterias.severity.$in, ['I', 'W', 'E', 'F']);
  });

  describe('Severity filter disabled states', async () => {
    it('should report DEBUG severity as disabled at OPS level', async () => {
      const disabled = await page.evaluate(() => {
        window.model.log.filter.setCriteria('level', 'max', 1);
        return window.model.log.filter.isSeverityDisabled('D');
      });

      assert.strictEqual(disabled, true);
    });

    it('should report DEBUG severity as enabled when level allows it', async () => {
      const disabled = await page.evaluate(() => {
        window.model.log.filter.setCriteria('level', 'max', 6);
        return window.model.log.filter.isSeverityDisabled('D');
      });

      assert.strictEqual(disabled, false);
    });

    it('should strip DEBUG from severity filter when switching to OPS', async () => {
      const severity = await page.evaluate(() => {
        window.model.log.filter.setCriteria('level', 'max', 11);
        window.model.log.filter.setCriteria('severity', 'in', 'I W E F D');
        window.model.log.filter.setCriteria('level', 'max', 1);
        return {
          in: window.model.log.filter.criterias.severity.in,
          $in: window.model.log.filter.criterias.severity.$in,
        };
      });

      assert.ok(Array.isArray(severity.$in));
      assert.deepStrictEqual(severity.$in, ['I', 'W', 'E', 'F']);
      assert.strictEqual(severity.in, 'I W E F');
    });

    it('should strip DEBUG from URL when severity is set before level', async () => {
      const severity = await page.evaluate(() => {
        window.model.log.filter.fromObject({ severity: { in: 'I W E F D' }, level: { max: 1 } });
        return {
          in: window.model.log.filter.criterias.severity.in,
          $in: window.model.log.filter.criterias.severity.$in,
        };
      });

      assert.ok(Array.isArray(severity.$in));
      assert.deepStrictEqual(severity.$in, ['I', 'W', 'E', 'F']);
      assert.strictEqual(severity.in, 'I W E F');
    });

    it('should strip DEBUG from URL when level is set before severity', async () => {
      const severity = await page.evaluate(() => {
        window.model.log.filter.fromObject({ level: { max: 1 }, severity: { in: 'I W E F D' } });
        return {
          in: window.model.log.filter.criterias.severity.in,
          $in: window.model.log.filter.criterias.severity.$in,
        };
      });

      assert.ok(Array.isArray(severity.$in));
      assert.deepStrictEqual(severity.$in, ['I', 'W', 'E', 'F']);
      assert.strictEqual(severity.in, 'I W E F');
    });

    it('should disable DEBUG button at OPS level', async () => {
      await page.evaluate(() => {
        window.model.log.filter.setCriteria('level', 'max', 1);
      });

      await page.waitForFunction(() => {
        const buttons = Array.from(document.querySelectorAll('.btn-group button.btn'));
        const debugBtn = buttons.find((b) => b.textContent.trim() === 'Debug');
        return debugBtn?.classList.contains('disabled');
      });
    });

    it('should enable DEBUG button when level is not OPS', async () => {
      await page.evaluate(() => {
        window.model.log.filter.setCriteria('level', 'max', 11);
      });

      await page.waitForFunction(() => {
        const buttons = Array.from(document.querySelectorAll('.btn-group button.btn'));
        const debugBtn = buttons.find((b) => b.textContent.trim() === 'Debug');
        return !debugBtn?.classList.contains('disabled');
      });
    });

    describe('Empty field toggle', async () => {
      afterEach(async () => {
        await page.evaluate(() => window.model.log.filter.resetCriteria());
      });

      it('should set emptyFor to "match" for a field', async () => {
        const result = await page.evaluate(() => {
          window.model.log.filter.setCriteria('hostname', 'emptyFor', 'match');
          return window.model.log.filter.criterias.hostname;
        });

        assert.strictEqual(result.emptyFor, 'match');
        assert.strictEqual(result.$emptyFor, 'match');
      });

      it('should set emptyFor to "exclude" for a field', async () => {
        const result = await page.evaluate(() => {
          window.model.log.filter.setCriteria('hostname', 'emptyFor', 'exclude');
          return window.model.log.filter.criterias.hostname;
        });

        assert.strictEqual(result.emptyFor, 'exclude');
        assert.strictEqual(result.$emptyFor, 'exclude');
      });

      it('should reset emptyFor when criteria are reset', async () => {
        const result = await page.evaluate(() => {
          window.model.log.filter.setCriteria('hostname', 'emptyFor', 'match');
          window.model.log.filter.resetCriteria();
          return window.model.log.filter.criterias.hostname;
        });

        assert.strictEqual(result.emptyFor, null);
        assert.strictEqual(result.$emptyFor, null);
      });

      it('should include emptyFor (but not $emptyFor) in toObject when set to match', async () => {
        const result = await page.evaluate(() => {
          window.model.log.filter.setCriteria('hostname', 'emptyFor', 'match');
          return window.model.log.filter.toObject().hostname;
        });

        assert.strictEqual(result.emptyFor, 'match');
        assert.strictEqual(result.$emptyFor, undefined);
      });

      it('should include emptyFor (but not $emptyFor) in toObject when set to exclude', async () => {
        const result = await page.evaluate(() => {
          window.model.log.filter.setCriteria('hostname', 'emptyFor', 'exclude');
          return window.model.log.filter.toObject().hostname;
        });

        assert.strictEqual(result.emptyFor, 'exclude');
        assert.strictEqual(result.$emptyFor, undefined);
      });

      it('should not include emptyFor in toObject when it was never set', async () => {
        const result = await page.evaluate(() => {
          window.model.log.filter.setCriteria('hostname', 'match', 'test');
          return window.model.log.filter.toObject();
        });

        assert.strictEqual(result.hostname.emptyFor, undefined);
      });

      it('should omit the field entirely from toObject when only emptyFor was set then cleared', async () => {
        const result = await page.evaluate(() => {
          window.model.log.filter.setCriteria('hostname', 'emptyFor', 'match');
          window.model.log.filter.setCriteria('hostname', 'emptyFor', null);
          return window.model.log.filter.toObject();
        });

        assert.strictEqual(result.hostname, undefined);
      });

      it('should have active class on toggle button when active', async () => {
        const btnSelector = '.table-filters tbody tr:nth-child(2) td:nth-child(2) button.empty-toggle';

        await page.evaluate(() => {
          window.model.log.filter.setCriteria('hostname', 'emptyFor', 'match');
        });

        await page.waitForFunction((sel) => {
          const toggleBtn = document.querySelector(sel);
          return toggleBtn?.classList.contains('active');
        }, {}, btnSelector);
      });

      it('should appear on hover and disappear when not hovered', async () => {
        const selector = '.table-filters tbody tr:nth-child(2) td:nth-child(2) .filter-input-group';
        const btnSelector = '.table-filters tbody tr:nth-child(2) td:nth-child(2) button.empty-toggle';

        await page.waitForFunction((sel) => {
          const btn = document.querySelector(sel);
          return btn && !btn.classList.contains('active');
        }, {}, btnSelector);

        const hiddenByDefault = await page.evaluate(
          (sel) => getComputedStyle(document.querySelector(sel)).display === 'none',
          btnSelector,
        );
        assert.strictEqual(hiddenByDefault, true);

        await page.hover(selector);

        const visibleOnHover = await page.evaluate(
          (sel) => getComputedStyle(document.querySelector(sel)).display !== 'none',
          btnSelector,
        );
        assert.strictEqual(visibleOnHover, true);

        await page.hover('.table-filters tbody tr:nth-child(1)');

        const hiddenAfterLeave = await page.evaluate(
          (sel) => getComputedStyle(document.querySelector(sel)).display === 'none',
          btnSelector,
        );
        assert.strictEqual(hiddenAfterLeave, true);
      });

      it('should toggle emptyFor to match when match toggle button is clicked', async () => {
        const btnSelector = '.table-filters tbody tr:nth-child(2) td:nth-child(2) button.empty-toggle';

        await page.hover('.table-filters tbody tr:nth-child(2) td:nth-child(2) .filter-input-group');
        await page.click(btnSelector);

        const result = await page.evaluate(() => window.model.log.filter.criterias.hostname);
        assert.strictEqual(result.emptyFor, 'match');
        assert.strictEqual(result.$emptyFor, 'match');
      });

      it('should toggle emptyFor off when match toggle button is clicked again', async () => {
        const btnSelector = '.table-filters tbody tr:nth-child(2) td:nth-child(2) button.empty-toggle';

        await page.evaluate(() => {
          window.model.log.filter.setCriteria('hostname', 'emptyFor', 'match');
        });

        await page.waitForFunction((sel) => document.querySelector(sel)?.classList.contains('active'), {}, btnSelector);

        await page.click(btnSelector);

        const result = await page.evaluate(() => window.model.log.filter.criterias.hostname);
        assert.strictEqual(result.emptyFor, null);
        assert.strictEqual(result.$emptyFor, null);
      });

      it('should restore emptyFor=match from fromObject', async () => {
        const result = await page.evaluate(() => {
          window.model.log.filter.fromObject({ hostname: { emptyFor: 'match' } });
          return window.model.log.filter.criterias.hostname;
        });

        assert.strictEqual(result.emptyFor, 'match');
        assert.strictEqual(result.$emptyFor, 'match');
      });

      it('should restore emptyFor=exclude from fromObject', async () => {
        const result = await page.evaluate(() => {
          window.model.log.filter.fromObject({ hostname: { emptyFor: 'exclude' } });
          return window.model.log.filter.criterias.hostname;
        });

        assert.strictEqual(result.emptyFor, 'exclude');
        assert.strictEqual(result.$emptyFor, 'exclude');
      });

      it('should include emptyFor in the URL and restore it on parse', async () => {
        const result = await page.evaluate(() => {
          window.model.log.filter.resetCriteria();
          window.model.log.filter.setCriteria('hostname', 'emptyFor', 'match');
          window.model.updateRouteOnModelChange();
          const url = window.location.search;

          const params = { q: decodeURIComponent(url.replace('?q=', '')) };
          window.model.parseLocation(params);

          return {
            url,
            emptyFor: window.model.log.filter.criterias.hostname.emptyFor,
            $emptyFor: window.model.log.filter.criterias.hostname.$emptyFor,
          };
        });

        const decodedURI = decodeURIComponent(result.url);
        assert.ok(decodedURI.includes('"emptyFor":"match"'));
        assert.strictEqual(result.emptyFor, 'match');
        assert.strictEqual(result.$emptyFor, 'match');
      });
    });
  });

  describe('Level filter select', async () => {
    it('should build a select components options for level to filter by', async () => {
      const options = await page.evaluate(() => {
        const select = document.getElementById('filter-level');
        return select ? Array.from(select.options)
          .map((element) => ({ value: element.value, text: element.text })) : null;
      });

      assert.deepStrictEqual(options, [
        { value: '1', text: 'Ops' },
        { value: '6', text: 'Support' },
        { value: '11', text: 'Devel' },
        { value: '', text: 'Trace' },
      ]);
    });

    it('should mark the currently active level option as selected', async () => {
      await page.evaluate(() => model.log.filter.setCriteria('level', 'max', 6));
      await page.waitForFunction(() => document.getElementById('filter-level')?.value === '6');

      const selectedValue = await page.evaluate(() => document.getElementById('filter-level')?.value);
      assert.strictEqual(selectedValue, '6');
    });

    it('should update level criteria when an option is selected', async () => {
      const level = await page.evaluate(() => {
        const select = document.getElementById('filter-level');
        select.value = '11';
        select.dispatchEvent(new Event('change'));
        return window.model.log.filter.criterias.level.max;
      });

      assert.strictEqual(level, 11);
    });

    it('should set level to null when Trace option is selected', async () => {
      const level = await page.evaluate(() => {
        const select = document.getElementById('filter-level');
        select.value = '';
        select.dispatchEvent(new Event('change'));
        return window.model.log.filter.criterias.level.max;
      });

      assert.strictEqual(level, null);
    });
  });

  describe('Log limit select', async () => {
    it('should display a select component for limit to filter by', async () => {
      const options = await page.evaluate(() => {
        const select = document.getElementById('log-limit');
        return select ? Array.from(select.options)
          .map((element) => ({ value: element.value, text: element.text })) : null;
      });

      assert.deepStrictEqual(options, [
        { value: '100000', text: '100k' },
        { value: '500000', text: '500k' },
        { value: '1000000', text: '1M' },
      ]);
    });

    it('should mark the currently active limit option as selected', async () => {
      await page.evaluate(() => window.model.log.setLimit(500000));
      await page.waitForFunction(() => document.getElementById('log-limit')?.value === '500000');

      const selectedValue = await page.evaluate(() => document.getElementById('log-limit')?.value);
      assert.strictEqual(selectedValue, '500000');
    });

    it('should update log limit when an option is selected', async () => {
      const limit = await page.evaluate(() => {
        const select = document.getElementById('log-limit');
        select.value = '1000000';
        select.dispatchEvent(new Event('change'));
        return window.model.log.limit;
      });

      assert.strictEqual(limit, 1000000);
    });
  });
});
