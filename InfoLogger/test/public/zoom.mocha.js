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

describe('Zoom test-suite', async () => {
  let page;

  before(async () => {
    page = test.page;
  });

  it('should have default zoom level of 1 with font size 0.7rem and matching row height', async () => {
    const result = await page.evaluate(() => {
      const container = document.querySelector('.logs-container');
      const style = getComputedStyle(container);
      return {
        fontSize: style.getPropertyValue('--log-font-size').trim(),
        rowHeight: style.getPropertyValue('--row-height').trim(),
        zoomLevel: window.model.zoom.level,
      };
    });

    assert.strictEqual(result.zoomLevel, 1, 'default zoom level should be 1');
    assert.strictEqual(result.fontSize, '0.7rem', 'default font size should be 0.7rem');
    assert.strictEqual(result.rowHeight, '0.91rem', 'default row height should be 0.91rem');
  });

  it('should zoom in with Ctrl++', async () => {
    await page.keyboard.down('Control');
    await page.keyboard.press('Equal');
    await page.keyboard.up('Control');

    const result = await page.evaluate(() => {
      const container = document.querySelector('.logs-container');
      const style = getComputedStyle(container);
      return {
        zoomLevel: window.model.zoom.level,
        fontSize: style.getPropertyValue('--log-font-size').trim(),
      };
    });

    assert.strictEqual(result.zoomLevel, 1.1, 'zoom level should increase by 0.1');
    assert.strictEqual(result.fontSize, '0.770rem', 'font size should scale with zoom');
  });

  it('should zoom out with Ctrl+-', async () => {
    await page.keyboard.down('Control');
    await page.keyboard.press('Minus');
    await page.keyboard.up('Control');

    const result = await page.evaluate(() => ({
      zoomLevel: window.model.zoom.level,
    }));

    assert.strictEqual(result.zoomLevel, 1, 'zoom level should decrease back to 1');
  });

  it('should not zoom below minimum level', async () => {
    for (let i = 0; i < 10; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press('Minus');
      await page.keyboard.up('Control');
    }

    const result = await page.evaluate(() => ({
      zoomLevel: window.model.zoom.level,
      min: window.model.zoom.min,
    }));

    assert.strictEqual(result.zoomLevel, result.min, 'zoom should not go below minimum');
  });

  it('should not zoom above maximum level', async () => {
    await page.evaluate(() => window.model.resetZoom());
    for (let i = 0; i < 35; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press('Equal');
      await page.keyboard.up('Control');
    }

    const result = await page.evaluate(() => ({
      zoomLevel: window.model.zoom.level,
      max: window.model.zoom.max,
    }));

    assert.strictEqual(result.zoomLevel, result.max, 'zoom should not go above maximum');
  });

  it('should reset zoom to default level', async () => {
    await page.evaluate(() => window.model.resetZoom());

    const result = await page.evaluate(() => {
      const container = document.querySelector('.logs-container');
      const style = getComputedStyle(container);
      return {
        zoomLevel: window.model.zoom.level,
        fontSize: style.getPropertyValue('--log-font-size').trim(),
        rowHeight: style.getPropertyValue('--row-height').trim(),
      };
    });

    assert.strictEqual(result.zoomLevel, 1, 'zoom level should reset to 1');
    assert.strictEqual(result.fontSize, '0.700rem', 'font size should reset to default');
    assert.strictEqual(result.rowHeight, '0.910rem', 'row height should reset to default');
  });

  it('should maintain row height ratio relative to font size across zoom levels', async () => {
    const ratios = [];
    for (let i = 0; i < 5; i++) {
      const result = await page.evaluate(() => {
        const fontSize = window.model.fontSize;
        const rowHeight = window.model.rowHeightRem;
        return { ratio: rowHeight / fontSize };
      });
      ratios.push(Number(result.ratio.toFixed(2)));
      await page.evaluate(() => window.model.zoomIn());
    }

    const allSame = ratios.every((r) => r === ratios[0]);
    assert.ok(allSame, `row height / font size ratio should be constant, got: ${ratios.join(', ')}`);

    await page.evaluate(() => window.model.resetZoom());
  });

  it('should zoom in with mouse wheel (Ctrl+scroll up)', async () => {
    const container = await page.$('.logs-container');
    const box = await container.boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    await page.mouse.move(x, y);
    await page.evaluate(() => {
      window.model.resetZoom();
      window.model.zoom.lastScrollTime = 0;
    });

    await page.evaluate((cx, cy) => {
      const event = new WheelEvent('wheel', {
        deltaY: -100,
        ctrlKey: true,
        bubbles: true,
        clientX: cx,
        clientY: cy,
      });
      document.querySelector('.flex-column.absolute-fill').dispatchEvent(event);
    }, x, y);

    const afterZoomIn = await page.evaluate(() => window.model.zoom.level);
    assert.strictEqual(afterZoomIn, 1.1, 'Ctrl+scroll up should zoom in');
  });

  it('should zoom out with mouse wheel (Ctrl+scroll down)', async () => {
    await page.evaluate(() => { window.model.zoom.lastScrollTime = 0; });

    const container = await page.$('.logs-container');
    const box = await container.boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    await page.evaluate((cx, cy) => {
      const event = new WheelEvent('wheel', {
        deltaY: 100,
        ctrlKey: true,
        bubbles: true,
        clientX: cx,
        clientY: cy,
      });
      document.querySelector('.flex-column.absolute-fill').dispatchEvent(event);
    }, x, y);

    const afterZoomOut = await page.evaluate(() => window.model.zoom.level);
    assert.strictEqual(afterZoomOut, 1, 'Ctrl+scroll down should zoom out');
  });

  it('should have reset button disabled at default zoom', async () => {
    await page.evaluate(() => window.model.resetZoom());
    await page.waitForFunction(() => {
      const resetBtn = document.querySelector('#reset-zoom-button');
      return resetBtn && resetBtn.disabled === true;
    }, { timeout: 2000 });
  });

  it('should have reset button enabled when zoomed', async () => {
    await page.evaluate(() => window.model.zoomIn());
    await page.waitForFunction(() => {
      const resetBtn = document.querySelector('#reset-zoom-button');
      return resetBtn && resetBtn.disabled === false;
    }, { timeout: 2000 });

    await page.evaluate(() => window.model.resetZoom());
  });
});
