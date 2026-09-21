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

import { h } from '/js/src/index.js';

import { severityClass } from './severityUtils.js';
import tableColGroup from './tableColGroup.js';

/**
 * Main content of ILG - simulates a big table scrolling.
 * .tableLogsContent is the scrolling area with hooks to listen to scroll changes
 * .tableLogsContentPlaceholder just fills .tableLogsContent with the height of all logs
 * .table-logs-content is the actual floating content, part of all logs, always on sight of user
 * Only some logs are displayed so user think he is scrolling on all logs, but in fact
 * he is only viewing ~30 logs window moving with scrolling. This allow good performance.
 * @param {Model} model - root model of the application
 * @returns {vnode} - the view of the table content
 */
export default (model) =>
  h(
    '.tableLogsContent.scroll-y.flex-grow',
    tableContainerHooks(model),
    h('div.tableLogsContentPlaceholder', {
      style: {
        height: `${model.log.list.length * model.log.rowHeight}px`,
        position: 'relative',
      },
    }, [
      h(
        'table.table-logs-content',
        scrollStyling(model),
        tableColGroup(model),
        h('tbody', [model.log.listLogsInViewportOnly(model).map((row) => tableLogLine(model, row))]),
      ),
    ]),
  );

/**
 * Set styles of the floating table and its position inside the big div .tableLogsContentPlaceholder
 * @param {Model} model - root model of the application
 * @returns {object} properties of floating table
 */
const scrollStyling = (model) => ({
  style: {
    position: 'absolute',
    top: `${model.log.scrollTop - model.log.scrollTop % model.log.rowHeight}px`,
  },
});

/**
 * Creates a line of log with tag <tr> and its columns <td> if enabled.
 * @param {Model} model - root model of the application
 * @param {Log} row - a row of this table is a raw log
 * @returns {vnode} - the log build as a table row
 */
const tableLogLine = (model, row) => {
  const { log, table } = model;
  return h('tr.row-hover', {
    className: log.item === row ? 'row-selected' : '',
    onclick: () => log.setItem(row),
    ondblclick: () => model.toggleInspector(),
  }, tableRows(model, table.colsHeader, row));
};

/**
 * Resolves the required data to send to the context menu based on the cell's field and content.
 * @param {Model} model - root model of the application
 * @param {string} field - the field associated to the cell (e.g. 'hostname', 'severity', etc.)
 * @param {string} content - the content of the cell
 * @returns {object|null} - the data for the context menu or null if not applicable
 */
const resolveContextMenuData = (model, field, content) => {
  const row = model.log.item;
  if (field === 'date') {
    return row.timestamp ? { field: 'timestamp', value: String(content) } : null;
  }
  if (field === 'time') {
    return row.timestamp
      ? { field: 'timestamp', value: `${model.timezone.format(row.timestamp, 'date')} ${content}` }
      : null;
  }
  return row[field] != null && row[field] !== '' ? { field, value: String(row[field]) } : null;
};

/**
 * Wraps a cell with a context menu with filtering and general options.
 * @param {Model} model - root model of the application
 * @param {object} row - values for each cell of the row
 * @param {string} field - the field associated to the cell (e.g. 'hostname', 'severity', etc.)
 * @param {string} content - the content of the cell
 * @param {string} extraClasses - extra CSS classes to add to the cell
 * @param {object} extraAttrs - extra attributes to add to the cell
 * @returns {vnode} - the cell wrapped with the context menu
 */
const cellWithContextMenu = (model, row, field, content, extraClasses = '', extraAttrs = {}) => {
  const openContextMenu = (e) => {
    model.log.setItem(row);
    const data = resolveContextMenuData(model, field, content);
    if (data) {
      e.preventDefault();
      model.log.contextMenu.show(data.field, data.value, e.clientX, e.clientY);
    }
  };

  const hasContent = content != null && content !== '';

  return h(`td.cell${extraClasses}`, {
    ...extraAttrs,
    oncontextmenu: hasContent ? openContextMenu : null,
  }, [
    // content sits directly in the <td> so that it can be selected/copied without new lines
    content,
    hasContent && h(
      'span.cell-context-menu-hint',
      {
        onclick: openContextMenu,
        title: 'Right-click also opens this menu',
      },
      '⋮',
    ),
  ]);
};

/**
 * Array of table rows
 * @param {Model} model - root model of the application
 * @param {object} colsHeader - columns header configuration and state
 * @param {object} row - values for each cell of the row
 * @returns {vnode} - the row of the table
 */
const tableRows = (model, colsHeader, row) => {
  const cell = (field, content, extraClasses = '', extraAttrs = {}) =>
    cellWithContextMenu(model, row, field, content, extraClasses, extraAttrs);

  const { date, time, hostname, rolename, pid, username,
    system, facility, detector, partition, run,
    errcode, errline, errsource, message } = colsHeader;

  const { severity, level, timestamp, hostname: hostnameVal, rolename: rolenameVal,
    pid: pidVal, username: usernameVal, system: systemVal, facility: facilityVal,
    detector: detectorVal, partition: partitionVal, run: runVal,
    errcode: errcodeVal, errline: errlineVal, errsource: errsourceVal,
    message: messageVal } = row;

  return [
    cell(
      'severity',
      severity,
      '.text-center',
      { className: model.log.item === row ? null : severityClass(severity) },
    ),
    cell('level', level, '.text-center.cell-bordered'),
    date.visible && cell('date', model.timezone.format(timestamp, 'date'), '.cell-bordered'),
    time.visible && cell('time', model.timezone.format(timestamp, model.log.timeFormat), '.cell-bordered'),
    hostname.visible && cell('hostname', hostnameVal, '.cell-bordered'),
    rolename.visible && cell('rolename', rolenameVal, '.cell-bordered'),
    pid.visible && cell('pid', pidVal, '.cell-bordered'),
    username.visible && cell('username', usernameVal, '.cell-bordered'),
    system.visible && cell('system', systemVal, '.cell-bordered'),
    facility.visible && cell('facility', facilityVal, '.cell-bordered'),
    detector.visible && cell('detector', detectorVal, '.cell-bordered'),
    partition.visible && cell('partition', partitionVal, '.cell-bordered'),
    run.visible && cell('run', runVal, '.cell-bordered'),
    errcode.visible && cell('errcode', linkToWikiErrors(errcodeVal), '.cell-bordered'),
    errline.visible && cell('errline', errlineVal, '.cell-bordered'),
    errsource.visible && cell('errsource', errsourceVal, '.cell-bordered'),
    message.visible && cell('message', messageVal, '.cell-bordered', { title: messageVal }),
  ];
};

/**
 * Creates link of error code to open in a new tab the wiki page associated
 * @param {number} errcode - error code to link
 * @returns {vnode} - the link to the wiki page
 */
const linkToWikiErrors = (errcode) => h('a', {
  href: `https://alice-daq.web.cern.ch/error_codes/${errcode}?from=ILG`,
  target: '_blank',
}, errcode);

/**
 * Hooks of .tableLogsContent for "smart scrolling"
 * This notifies model of its size and scrolling position to compute logs to draw
 * @param {Model} model - root model of the application
 * @returns {object} object containing hooks
 */
const tableContainerHooks = (model) => ({

  /**
   * Hook. Listen to events needed for handling scrolling like window size change
   * And set scroll change handler to internal state of dom element
   * @param {vnode} vnode - the vnode of the element
   */
  oncreate(vnode) {
    /**
     * THis handler allow to notify model of element scrolling change (.tableLogsContent)
     */
    const onTableScroll = () => {
      const container = vnode.dom;
      const { height } = container.getBoundingClientRect();
      const scrollTop = Math.max(container.scrollTop, 0); // cancel negative position due to Safari bounce scrolling
      if (container.scrollTop < model.log.scrollTop) {
        model.log.disableAutoScroll(); // stop auto-scrolling if user scroll sup
      }
      model.log.setScrollTop(scrollTop, height);
    };

    // call the function when scrolling is updated
    vnode.dom.addEventListener('scroll', onTableScroll);
    model.log.dom.table = vnode.dom;
    // setup window size listener - view needs redraw for smart scrolling
    window.addEventListener('resize', onTableScroll);

    // remember this function for later (destroy)
    vnode.dom.onTableScroll = onTableScroll;

    // call the function once on next frame when we know sizes
    onTableScroll();
  },

  /**
   * Hook. Update scrolling strategy on model change
   * @param {vnode} vnode - the vnode of the element
   */
  onupdate(vnode) {
    autoscrollManager(model, vnode);
  },

  /**
   * Hook. Remove listeners when element is destroyed
   * @param {vnode} vnode - the vnode of the element
   */
  ondestroy(vnode) {
    vnode.dom.removeEventListener('scroll', vnode.dom.onTableScroll);
    window.removeEventListener('resize', vnode.dom.onTableScroll);
  },
});

/**
 * Handle scrolling to selected item or auto-scroll to bottom
 * 'Autoscroll' is higher priority over 'scroll to selected item'
 * @param {Model} model - root model of the application
 * @param {vnode} vnode - the vnode of the element
 */
const autoscrollManager = (model, vnode) => {
  // Autoscroll to bottom in live mode
  if (model.log.autoScrollLive && model.log.isLiveModeRunning() && model.log.list.length) {
    // Scroll only if last element is a new one
    const previousLastLogId = vnode.dom.dataset.lastLogId;
    const currentLastLogId = String(pointerId(model.log.list[model.log.list.length - 1]));

    if (previousLastLogId !== currentLastLogId) {
      // scroll at maximum bottom possible
      vnode.dom.scrollTo(0, model.log.rowHeight * model.log.applicationLimit);
      vnode.dom.dataset.lastLogId = currentLastLogId;
    }

    // don't try to scroll to selected item when auto-scroll is ON
    return;
  }

  // Autoscroll to selected item
  if (model.log.item) {
    // Scroll only if we did not previously, save last try in DOM dataset
    const previousSelectedItemId = vnode.dom.dataset.selectedItemId;
    const currentSelectedItemId = String(pointerId(model.log.item));

    if (previousSelectedItemId !== currentSelectedItemId && model.log.autoScrollToItem) {
      // scroll to an index * height of row, centered
      const index = model.log.list.indexOf(model.log.item);
      const positionRow = model.log.rowHeight * index;
      const halfView = model.log.scrollHeight / 2;
      vnode.dom.scrollTo(0, positionRow - halfView);
    }

    // Save the fact that we changed `item`
    if (previousSelectedItemId !== currentSelectedItemId) {
      vnode.dom.dataset.selectedItemId = currentSelectedItemId;
    }
  }
};

const pointers = new WeakMap();
let currentAddress = 0;

/**
 * Generates a unique number for the provided object like a pointer or id
 * Two calls with the same object will provide the same number.
 * Uses a WeekMap so no memory leak.
 * @param {object} obj - the object that needs to be identified
 * @returns {number} a unique pointer number
 */
function pointerId(obj) {
  let ptr = pointers.get(obj);
  if (!ptr) {
    ptr = currentAddress++;
    pointers.set(obj, ptr);
  }
  return ptr;
}
