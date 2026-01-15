/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { strictEqual, ok, deepStrictEqual, notDeepStrictEqual } from 'node:assert';
import { delay } from '../../testUtils/delay.js';
import { getLocalStorage, getLocalStorageAsJson } from '../../testUtils/localStorage.js';
import { StorageKeysEnum } from '../../../public/common/enums/storageKeys.enum.js';

const OBJECT_TREE_PAGE_PARAM = '?page=objectTree';
const SORTING_BUTTON_PATH = 'header > div > div > div:nth-child(3) > div > button';

/**
 * Initial page setup tests
 * @param {string} url - URL needed to open page for testing
 * @param {object} page - Puppeteer page object
 * @param {timeout} timeout - Timeout PER test; default 100
 * @param {object} testParent - Node.js test object which ensures sub-tests are being awaited
 */
export const objectTreePageTests = async (url, page, timeout = 5000, testParent) => {
  await testParent.test('should successfully load objectTree page "/"', { timeout }, async () => {
    await page.goto(`${url}${OBJECT_TREE_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
    const location = await page.evaluate(() => window.location);
    strictEqual(location.search, OBJECT_TREE_PAGE_PARAM);
  });

  await testParent.test('should have a tree as a table', { timeout }, async () => {
    const tableRowPath = 'section > div > div > div > div > table > tbody > tr';
    await page.waitForSelector(tableRowPath, { timeout: 1000 });
    const rowsCount = await page.evaluate(
      (tableRowPath) => document.querySelectorAll(tableRowPath).length,
      tableRowPath,
    );
    ok(rowsCount > 1); // more than 1 object in the tree
  });

  await testParent.test('should preserve state if refreshed', { timeout }, async () => {
    const selector = 'section > div > div > div > div > table > tbody > tr:nth-child(2)';
    await page.locator(selector).click();
    await page.reload({ waitUntil: 'networkidle0' });

    const rowCountExpanded = await page.evaluate(() =>
      document.querySelectorAll('section > div > div > div > div > table > tbody > tr').length);

    await page.locator(selector).click();
    await page.reload({ waitUntil: 'networkidle0' });

    const rowCountCollapsed = await page.evaluate(() =>
      document.querySelectorAll('section > div > div > div > div > table > tbody > tr').length);

    strictEqual(rowCountExpanded, 3);
    strictEqual(rowCountCollapsed, 2);
  });

  await testParent.test('should have a button to sort by (default "Name" ASC)', async () => {
    const sortByButtonTitle = await page.evaluate((path) => document.querySelector(path).title, '.sort-button');
    strictEqual(sortByButtonTitle, 'Sort DESC by Name');
  });

  await testParent.test('should have first element in tree as "qc/test/object/1"', async () => {
    const { name } = await page.evaluate(() => window.model.object.currentList[0]);
    strictEqual(name, 'qc/test/object/1');
  });

  await testParent.test(
    'should have a correctly made download root as object button',
    { timeout },
    async () => {
      const objectId = '016fa8ac-f3b6-11ec-b9a9-c0a80209250c';
      await page.evaluate(() => document.querySelector('tr.object-selectable:nth-child(2)').click());
      await delay(500);
      await page.evaluate(() => document.querySelector('tr.object-selectable:nth-child(3)').click());
      await delay(500);
      await page.evaluate(() => document.querySelector('tr.object-selectable:nth-child(4)').click());
      await delay(1000);
      const dlButton = await page.evaluate(() => document.querySelector('.download-button').href);
      const token = await page.evaluate(() => model.session.token);
      strictEqual(dlButton, `${url}api/object/proxy/download/?token=${token}&objectIds=${objectId}`);
    },
  );

  await testParent.test(
    'should have a correctly made download root as image button',
    { timeout },
    async () => {
      const exists = await page.evaluate(() => document.querySelector('.download-root-image-png-button') !== null);

      ok(exists, 'Expected ROOT image download button to exist');
    },
  );

  await testParent.test(
    'should have default panel width of 50% when width is null in localStorage',
    { timeout },
    async () => {
      const defaultValue = '50%';
      const panelWidth = await page.evaluate(() =>
        document.querySelector('section > div > div > div:nth-child(1)').style.width);
      const personId = await page.evaluate(() => window.model.session.personid);
      const storedPanelWidth = await getLocalStorage(
        page,
        `${StorageKeysEnum.OBJECT_VIEW_LEFT_PANEL_WIDTH}-${personId}`,
      );
      strictEqual(storedPanelWidth, null);
      strictEqual(panelWidth, defaultValue);
    },
  );

  await testParent.test(
    'should change and store panel width when dragging the divider',
    { timeout },
    async () => {
      const dragAmount = 35;
      const [container, divider] = await Promise.all([
        page.$('body > div.absolute-fill.flex-column > div > section'),
        page.$('section > div > div > div:nth-child(2)'),
      ]);
      const [containerBB, dividerBB] = await Promise.all([container.boundingBox(), divider.boundingBox()]);

      const centerX = dividerBB.x + dividerBB.width / 2;
      const centerY = dividerBB.y + dividerBB.height / 2;
      const targetX = containerBB.x + containerBB.width * (dragAmount / 100);

      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(targetX, centerY, { steps: 5 });
      await page.mouse.up();
      await delay(300);

      const [personId, panelWidth] = await page.evaluate(() => [
        window.model.session.personid,
        document.querySelector('section > div > div > div:nth-child(1)').style.width,
      ]);
      const storedWidth = await getLocalStorage(page, `${StorageKeysEnum.OBJECT_VIEW_LEFT_PANEL_WIDTH}-${personId}`);

      strictEqual(panelWidth, `${dragAmount}%`);
      strictEqual(storedWidth, dragAmount.toString());
    },
  );

  await testParent.test(
    'should maintain panel width from localStorage on page reload',
    { timeout },
    async () => {
      const dragAmount = 35;
      await page.reload({ waitUntil: 'networkidle0' });
      await page.evaluate(() => document.querySelector('tr.object-selectable:nth-child(4)').click());
      await delay(1000);
      const panelWidth = await page.evaluate(() =>
        document.querySelector('section > div > div > div:nth-child(1)').style.width);
      strictEqual(panelWidth, `${dragAmount}%`);
    },
  );

  await testParent.test(
    'should correctly render the path as first in the object info panel',
    { timeout },
    async () => {
      const firstRowKey = await page.evaluate(() =>
        document.querySelector('#qcObjectInfoPanel > div:first-child > b').textContent);
      strictEqual(firstRowKey, 'Path');
    },
  );

  await testParent.test(
    'should contain four highlighted rows',
    { timeout },
    async () => {
      const highlightedClasses = '.info-row.highlighted';
      const rowCount = await page.evaluate((selector) =>
        document.querySelectorAll(`#qcObjectInfoPanel > div${selector}`).length, highlightedClasses);
      strictEqual(rowCount, 4);
    },
  );

  await testParent.test(
    'should copy the value of the element clicked to the clipboard',
    { timeout },
    async () => {
      const context = page.browserContext();
      await context.overridePermissions(url, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);

      await page.click('#qcObjectInfoPanel > div > div');

      const clipboard = await page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return navigator.clipboard.readText();
      });

      strictEqual(clipboard, 'qc/test/object/1');
      context.clearPermissionOverrides();
    }
  );

  await testParent.test(
    'should not copy the value of the clicked element if there is no value',
    { timeout },
    async () => {
      const context = page.browserContext();
      await context.overridePermissions(url, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);

      await page.click('#qcObjectInfoPanel > div > div'); // copy path
      await page.click('#qcObjectInfoPanel > div:nth-child(7) > div'); // try to copy empty value

      const clipboard = await page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return navigator.clipboard.readText();
      });

      strictEqual(clipboard, 'qc/test/object/1');
      context.clearPermissionOverrides();
    }
  );

  await testParent.test(
    'should close the object plot upon clicking the close button',
    { timeout },
    async () => {
      await page.evaluate(() => document.querySelector('#close-button').click());
      // wait for animations to finish before continuing
      await page.waitForFunction(
        (selector) => document.querySelector(selector).children.length === 1,
        {},
        'section > div > div'
      );
      const selectedObject = await page.evaluate(() => model.object.selected);
      const numberOfChildren = await page.evaluate(() =>
        document.querySelector('section > div > div').children.length
      );
      strictEqual(selectedObject, undefined);
      strictEqual(numberOfChildren, 1);
    }
  );

  await testParent.test('should update local storage when tree node is clicked', { timeout }, async () => {
    const selector = 'section > div > div > div > div > table > tbody > tr:nth-child(2)';
    const personid = await page.evaluate(() => window.model.session.personid);
    const storageKey = `${StorageKeysEnum.OBJECT_TREE_OPEN_BRANCH_STATE}-${personid}`;

    await page.locator(selector).click();
    const localStorageBefore = await getLocalStorageAsJson(page, storageKey);

    await page.locator(selector).click();
    const localStorageAfter = await getLocalStorageAsJson(page, storageKey);

    notDeepStrictEqual(
      localStorageBefore,
      localStorageAfter,
      'local storage should have changed after clicking a tree node',
    );
  });

  await testParent.test('should sort list of histograms by name in descending order', async () => {
    await page.locator('.sort-button').click();

    const sorted = await page.evaluate(() => ({
      list: window.model.object.currentList,
      sort: window.model.object.sortBy,
    }));
    strictEqual(sorted.sort.title, 'Name');
    strictEqual(sorted.sort.order, -1);
    strictEqual(sorted.sort.field, 'name');
    strictEqual(sorted.list[0].name, 'qc/test/object/2');
  });

  await testParent.test('should sort list of histograms by name in ascending order', async () => {
    await page.locator('.sort-button').click();

    const sorted = await page.evaluate(() => ({
      list: window.model.object.currentList,
      sort: window.model.object.sortBy,
    }));
    strictEqual(sorted.sort.title, 'Name');
    strictEqual(sorted.sort.order, 1);
    strictEqual(sorted.sort.field, 'name');
    strictEqual(sorted.list[0].name, 'qc/test/object/1');
  });

  await testParent.test(
    'should close all branches when clicking the collapse all button',
    { timeout },
    async () => {
      const selector = '#collapse-tree-button';
      const personid = await page.evaluate(() => window.model.session.personid);
      const storageKey = `${StorageKeysEnum.OBJECT_TREE_OPEN_BRANCH_STATE}-${personid}`;

      await page.locator(selector).click();
      await delay(100);
      const storedNodes = await getLocalStorageAsJson(page, storageKey);
      const tableRowCount = await page.evaluate(() =>
        document.querySelectorAll('section > div > div > div > div > table > tbody > tr').length);

      deepStrictEqual(storedNodes, {}, 'Stores nodes should be empty');
      strictEqual(tableRowCount, 1, 'Tree should be fully collapsed');
    },
  );

  await testParent.test('should have filtered results on input search', async () => {
    await page.type('#searchObjectTree', 'qc/test/object/1');
    const rowsDisplayed = await page.evaluate(() => {
      const rows = [];
      document.querySelectorAll('section > div > div > div > div > table > tbody > tr')
        .forEach((item) => rows.push(item.innerText));
      return rows;
    }, { timeout: 5000 });
    const filteredRows = rowsDisplayed.filter((name) => name.includes('qc/test/object/1'));
    ok(
      filteredRows.length === rowsDisplayed.length,
      'Not all rows contain the searched term.'
      + `Identified filtered: ${filteredRows.length} and displayed: ${rowsDisplayed.length}`,
    );
  });

  await testParent.test(
    'should have a selector with sorted options to filter by run type if there are run types loaded',
    { timeout },
    async () => {
      const selectorId = '#runTypeFilter > option';

      const options = await page.evaluate((selectorId) => {
        const optionElements = document.querySelectorAll(selectorId);
        return Array.from(optionElements).map((option) => option.value);
      }, selectorId);

      deepStrictEqual(options, ['', 'runType1', 'runType2']);
    },
  );

  await testParent.test(
    'should navigate object tree and search results with arrow keys and enter key',
    { timeout },
    async () => {
      await page.goto(`${url}${OBJECT_TREE_PAGE_PARAM}`, { waitUntil: 'networkidle0' });

      // Focus first node
      await page.keyboard.press('ArrowDown');
      await delay(200);
      const isFirstObjectFocused = await page.evaluate(() => {
        const selectedNode = document.querySelector('tr.object-selectable');
        return selectedNode?.classList.contains('focused-node');
      });
      strictEqual(isFirstObjectFocused, true, 'The first object is not focused.');

      // Focus second node and expand
      await page.keyboard.press('ArrowDown'); // Focus second node
      await page.keyboard.press('ArrowRight'); // Expand focused node
      await delay(200);
      const isNodeExpanded = await page.evaluate(() => {
        const [, selectedNode] = document.querySelectorAll('tr.object-selectable');
        return selectedNode?.classList.contains('focused-node');
      });
      strictEqual(isNodeExpanded, true, 'The focused node was not expanded on pressing ArrowRight key.');

      // Focus third node, expand and select a leaf node
      await page.keyboard.press('ArrowDown'); // Focus third node
      await page.keyboard.press('ArrowRight'); // Expand focused node
      await page.keyboard.press('ArrowDown'); // Focus fourth node
      await page.keyboard.press('Enter'); // Select focused leaf node
      await delay(500);
      const isObjectSelected = await page.evaluate(() => model.object.selected !== undefined);
      const isObjectPlotOpened = await page.evaluate(() => {
        const objectPanel = document.querySelector('#qcObjectInfoPanel');
        return objectPanel !== null && objectPanel !== undefined;
      });
      strictEqual(isObjectSelected, true, 'Focused leaf node was not selected on pressing ArrowRight key.');
      strictEqual(isObjectPlotOpened, true, 'Object plot panel is not opened after selecting the focused leaf node.');

      // Collapse parent node of the focused leaf node
      await page.keyboard.press('ArrowLeft');
      await delay(200);
      const nodeCountAfterCollapse = await page.evaluate(() => {
        const nodes = document.querySelectorAll('tr.object-selectable');
        return nodes.length;
      });
      strictEqual(
        nodeCountAfterCollapse,
        3,
        'The object tree navigation does not have exactly 3 nodes after collapsing the parent.',
      );

      // Focus previous node
      await page.keyboard.press('ArrowUp');
      await delay(200);
      const isSecondNodeHighlightedAgain = await page.evaluate(() => {
        const [, selectedNode] = document.querySelectorAll('tr.object-selectable');
        return selectedNode?.classList.contains('focused-node');
      });
      strictEqual(isSecondNodeHighlightedAgain, true, 'The second node is not highlighted after pressing ArrowUp key.');

      // Collapse tree
      await page.keyboard.press('ArrowLeft');
      await delay(200);
      const isNodeCollapsed = await page.evaluate(() => {
        const nodes = document.querySelectorAll('tr.object-selectable');
        return nodes.length < 3; // Check if there are less than 3 nodes
      });
      strictEqual(isNodeCollapsed, true, 'The third node is still present after collapsing the second node.');
    },
  );

  await testParent.test(
    'should navigate object tree and search results with arrow keys and enter key when search active',
    { timeout },
    async () => {
      await page.goto(`${url}${OBJECT_TREE_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
      await page.focus('#searchObjectTree');
      await page.type('#searchObjectTree', 'qc/test/object');

      // Focus first object in search results
      await page.keyboard.press('ArrowDown');
      await delay(200);
      const isFirstObjectHighlighted = await page.evaluate(() => {
        const selectedNode = document.querySelector('tr.object-selectable');
        return selectedNode?.classList.contains('focused-node');
      });
      strictEqual(isFirstObjectHighlighted, true, 'The first object in search results is not highlighted.');

      // Select focused object
      await page.keyboard.press('Enter');
      await delay(500);
      const isObjectSelected = await page.evaluate(() => model.object.selected !== undefined);
      const isObjectPlotOpened = await page.evaluate(() => {
        const objectPanel = document.querySelector('#qcObjectInfoPanel');
        return objectPanel !== null && objectPanel !== undefined;
      });
      strictEqual(
        isObjectSelected,
        true,
        'The focused object in search results was not selected on pressing ArrowRight key.',
      );
      strictEqual(
        isObjectPlotOpened,
        true,
        'The object plot panel is not opened after selecting the focused object in search results.',
      );
    },
  );
};
