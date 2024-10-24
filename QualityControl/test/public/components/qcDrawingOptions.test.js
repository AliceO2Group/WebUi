/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file 'COPYING'.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import assert from 'node:assert';

/**
 * Initial page setup tests
 * @param {string} url - URL needed to open page for testing
 * @param {object} page - Puppeteer page object
 * @param {number} timeout - Timeout PER individual test; default 1000
 * @param {object} testParent - Node.js test object
 */
export const qcDrawingOptionsTests = async (url, page, timeout = 1000, testParent) => {
  await testParent.test('should load', { timeout }, async () => {
    // Id 5aba4a059b755d517e76ea12 is set in QCModelDemo
    await page.goto(
      `${url}?page=layoutShow&layoutId=5aba4a059b755d517e76ea10`,
      { waitUntil: 'networkidle0' },
    );
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(
      location.search,
      '?page=layoutShow&layoutId=5aba4a059b755d517e76ea10',
    );
  });

  await testParent.test('should merge options on layoutShow and no ignoreDefaults field', async () => {
    const drawingOptions = await page.evaluate(() => {
      const tabObject = { options: ['args', 'coly'] };
      const objectRemoteData = {
        payload: { qcObject: { fOption: 'lego colz' } },
      };
      return window.model.object.generateDrawingOptions(
        tabObject,
        objectRemoteData,
      );
    });

    const expDrawingOpts = ['lego', 'colz', 'args', 'coly'];
    assert.deepStrictEqual(drawingOptions, expDrawingOpts);
  });

  await testParent.test('should merge options on layoutShow and false ignoreDefaults field', async () => {
    const drawingOptions = await page.evaluate(() => {
      const tabObject = { ignoreDefaults: false, options: ['args', 'coly'] };
      const objectRemoteData = {
        payload: { qcObject: { fOption: 'lego colz' } },
      };
      return window.model.object.generateDrawingOptions(
        tabObject,
        objectRemoteData,
      );
    });

    const expDrawingOpts = ['lego', 'colz', 'args', 'coly'];
    assert.deepStrictEqual(drawingOptions, expDrawingOpts);
  });

  await testParent.test('should ignore default options on layoutShow and true ignoreDefaults field', async () => {
    const drawingOptions = await page.evaluate(() => {
      const tabObject = { ignoreDefaults: true, options: ['args', 'coly'] };
      const objectRemoteData = {
        payload: { qcObject: { fOption: 'lego colz' } },
      };
      return window.model.object.generateDrawingOptions(
        tabObject,
        objectRemoteData,
      );
    });

    const expDrawingOpts = ['args', 'coly'];
    assert.deepStrictEqual(drawingOptions, expDrawingOpts);
  });

  await testParent.test('should use only default options on objectTree', async () => {
    const drawingOptions = await page.evaluate(() => {
      window.model.page = 'objectTree';
      const tabObject = { options: ['args', 'coly'] };
      const objectRemoteData = {
        payload: { qcObject: { fOption: 'lego colz' } },
      };
      return window.model.object.generateDrawingOptions(
        tabObject,
        objectRemoteData,
      );
    });

    const expDrawingOpts = ['lego', 'colz'];
    assert.deepStrictEqual(drawingOptions, expDrawingOpts);
  });

  await testParent.test(
    'should use only default options(foption and metadata) on objectView when no layoutId or objectId is set',
    async () => {
      const drawingOptions = await page.evaluate(() => {
        window.model.page = 'objectView';
        window.model.router.params.objectId = undefined;
        window.model.router.params.layoutId = undefined;
        const tabObject = { options: ['args', 'coly'] };
        const objectRemoteData = {
          payload: {
            qcObject: {
              fOption: 'lego colz',
              displayHints: 'hint hint2',
              drawingOptions: 'option option2',
            },
          },
        };
        return window.model.object.generateDrawingOptions(
          tabObject,
          objectRemoteData,
        );
      });

      const expDrawingOpts = [
        'lego',
        'colz',
        'option',
        'option2',
        'hint',
        'hint2',
      ];
      assert.deepStrictEqual(expDrawingOpts, drawingOptions);
    },
  );

  await testParent.test('should use only default options on objectView when no layoutId is set', async () => {
    const drawingOptions = await page.evaluate(() => {
      window.model.page = 'objectView';
      window.model.router.params.layoutId = undefined;
      window.model.router.params.objectId = '123';
      const tabObject = { options: ['args', 'coly'] };
      const objectRemoteData = {
        payload: { qcObject: { fOption: 'lego colz' } },
      };
      return window.model.object.generateDrawingOptions(
        tabObject,
        objectRemoteData,
      );
    });

    const expDrawingOpts = ['lego', 'colz'];
    assert.deepStrictEqual(drawingOptions, expDrawingOpts);
  });

  await testParent.test('should use only default options on objectView when no objectId is set', async () => {
    const drawingOptions = await page.evaluate(() => {
      window.model.page = 'objectView';
      window.model.router.params.objectId = undefined;
      window.model.router.params.layoutId = '123';
      const tabObject = { options: ['args', 'coly'] };
      const objectRemoteData = {
        payload: { qcObject: { fOption: 'lego colz' } },
      };
      return window.model.object.generateDrawingOptions(
        tabObject,
        objectRemoteData,
      );
    });

    const expDrawingOpts = ['lego', 'colz'];
    assert.deepStrictEqual(drawingOptions, expDrawingOpts);
  });

  await testParent.test('should merge options on objectView and no ignoreDefaults field', async () => {
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
      const objectRemoteData = {
        payload: { qcObject: { fOption: 'lego colz' } },
      };
      return window.model.object.generateDrawingOptions(
        null,
        objectRemoteData,
      );
    });

    const expDrawingOpts = ['lego', 'colz', 'gridx'];
    assert.deepStrictEqual(drawingOptions, expDrawingOpts);
  });

  await testParent.test('should merge options on objectView and false ignoreDefaults field', async () => {
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
      const objectRemoteData = {
        payload: { qcObject: { fOption: 'lego colz' } },
      };
      return window.model.object.generateDrawingOptions(
        null,
        objectRemoteData,
      );
    });

    const expDrawingOpts = ['lego', 'colz', 'gridx'];
    assert.deepStrictEqual(drawingOptions, expDrawingOpts);
  });

  await testParent.test('should ignore default options on objectView and true ignoreDefaults field', async () => {
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
      const objectRemoteData = {
        payload: { qcObject: { fOption: 'lego colz' } },
      };
      return window.model.object.generateDrawingOptions(
        null,
        objectRemoteData,
      );
    });

    const expDrawingOpts = ['gridx'];
    assert.deepStrictEqual(drawingOptions, expDrawingOpts);
  });
};
