import {h} from '/js/src/index.js';

import {severityClass} from './severityUtils.js';
import tableColGroup from './tableColGroup.js';

const ROW_HEIGHT = 18; // sync with CSS value

/**
 * Main content of ILG - simulates a big table scrolling.
 * .tableLogsContent is the scrolling area with hooks to listen to scroll changes
 * .tableLogsContentPlaceholder just fills .tableLogsContent with the height of all logs
 * .table-logs-content is the actual floating content, part of all logs, always on sight of user
 * Only some logs are displayed so user think he is scrolling on all logs, but in fact
 * he is only viewing ~30 logs window moving with scrolling. This allow good performance.
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.tableLogsContent.scroll-y.flex-grow', tableContainerHooks(model),
  h('div.tableLogsContentPlaceholder', {
    style: {
      height: model.log.list.length * ROW_HEIGHT + 'px',
      position: 'relative'
    }
  }, [
    h('table.table-logs-content', scrollStyling(model),
      tableColGroup(model),
      h('tbody', [
        listLogsInViewportOnly(model).map((row) => tableLogLine(model, row))
      ]),
    )
  ]),
);

/**
 * Set styles of the floating table and its position inside the big div .tableLogsContentPlaceholder
 * @param {Object} model
 * @return {Object} properties of floating table
 */
const scrollStyling = (model) => ({
  style: {
    position: 'absolute',
    top: model.log.scrollTop - (model.log.scrollTop % ROW_HEIGHT) + 'px'
  }
});

/**
 * Returns an array of logs that are indeed visible to user, hidden top and hidden bottom logs
 * are not present in this array output
 * ceil() and + 1 ensure we see top and bottom logs coming
 * @param {Object} model
 * @return {Array.<Log>}
 */
const listLogsInViewportOnly = (model) => model.log.list.slice(
  Math.floor(model.log.scrollTop / ROW_HEIGHT),
  Math.floor(model.log.scrollTop / ROW_HEIGHT) + Math.ceil(model.log.scrollHeight / ROW_HEIGHT) + 1
);

/**
 * Creates a line of log with tag <tr> and its columns <td> if enabled.
 * @param {Object} model
 * @param {Log} row - a row of this table is a raw log
 * @return {vnode}
 */
const tableLogLine = (model, row) => h('tr.row-hover', {
  className: model.log.item === row ? 'row-selected' : '',
  onclick: () => model.log.setItem(row)
}, [
  h('td.cell.text-center', {className: model.log.item === row ? null : severityClass(row.severity)}, row.severity),
  model.table.colsHeader.date.visible && h('td.cell.cell-bordered', model.timezone.format(row.timestamp, 'date')),
  model.table.colsHeader.time.visible && h('td.cell.cell-bordered', model.timezone.format(row.timestamp, model.log.timeFormat)),
  model.table.colsHeader.hostname.visible && h('td.cell.cell-bordered', row.hostname),
  model.table.colsHeader.rolename.visible && h('td.cell.cell-bordered', row.rolename),
  model.table.colsHeader.pid.visible && h('td.cell.cell-bordered', row.pid),
  model.table.colsHeader.username.visible && h('td.cell.cell-bordered', row.username),
  model.table.colsHeader.system.visible && h('td.cell.cell-bordered', row.system),
  model.table.colsHeader.facility.visible && h('td.cell.cell-bordered', row.facility),
  model.table.colsHeader.detector.visible && h('td.cell.cell-bordered', row.detector),
  model.table.colsHeader.partition.visible && h('td.cell.cell-bordered', row.partition),
  model.table.colsHeader.run.visible && h('td.cell.cell-bordered', row.run),
  model.table.colsHeader.errcode.visible && h('td.cell.cell-bordered', linkToWikiErrors(row.errcode)),
  model.table.colsHeader.errline.visible && h('td.cell.cell-bordered', row.errline),
  model.table.colsHeader.errsource.visible && h('td.cell.cell-bordered', row.errsource),
  model.table.colsHeader.message.visible && h('td.cell.cell-bordered', {title: row.message}, row.message),
]);

/**
 * Creates link of error code to open in a new tab the wiki page associated
 * @param {number} errcode
 * @return {vnode}
 */
const linkToWikiErrors = (errcode) => h('a', {
  href: `https://alice-daq.web.cern.ch/error_codes/${errcode}?from=ILG`,
  target: '_blank'},
errcode);

/**
 * Hooks of .tableLogsContent for "smart scrolling"
 * This notifies model of its size and scrolling position to compute logs to draw
 * @param {Object} model
 * @return {Object} object containing hooks
 */
const tableContainerHooks = (model) => ({
  /**
   * Hook. Listen to events needed for handling scrolling like window size change
   * And set scroll change handler to internal state of dom element
   * @param {vnode} vnode
   */
  oncreate(vnode) {
    /**
     * THis handler allow to notify model of element scrolling change (.tableLogsContent)
     */
    const onTableScroll = () => {
      const container = vnode.dom;
      const height = container.getBoundingClientRect().height;
      const scrollTop = Math.max(container.scrollTop, 0); // cancel negative position due to Safari bounce scrolling
      model.log.setScrollTop(scrollTop, height);
    };

    // call the function when scrolling is updated
    vnode.dom.addEventListener('scroll', onTableScroll);

    // setup window size listener - view needs redraw for smart scrolling
    window.addEventListener('resize', onTableScroll);

    // remember this function for later (destroy)
    vnode.dom.onTableScroll = onTableScroll;

    // call the function once on next frame when we know sizes
    onTableScroll();
  },

  /**
   * Hook. Update scrolling strategy on model change
   * @param {vnode} vnode
   */
  onupdate(vnode) {
    autoscrollManager(model, vnode);
  },

  /**
   * Hook. Remove listeners when element is destroyed
   * @param {vnode} vnode
   */
  ondestroy(vnode) {
    vnode.dom.removeEventListener('scroll', vnode.dom.onTableScroll);
    window.removeEventListener('resize', vnode.dom.onTableScroll);
  }
});

/**
 * Handle scrolling to selected item or auto-scroll to bottom
 * 'Autoscroll' is higher priority over 'scroll to selected item'
 * @param {Object} model
 * @param {vnode} vnode
 */
const autoscrollManager = (model, vnode) => {
  // Autoscroll to bottom in live mode
  if (model.log.autoScrollLive && model.log.isLiveModeRunning() && model.log.list.length) {
    // Scroll only if last element is a new one
    const previousLastLogId = vnode.dom.dataset.lastLogId;
    const currentLastLogId = String(pointerId(model.log.list[model.log.list.length - 1]));

    if (previousLastLogId !== currentLastLogId) {
      // scroll at maximum bottom possible
      vnode.dom.scrollTo(0, ROW_HEIGHT * model.log.applicationLimit);
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
      const positionRow = ROW_HEIGHT * index;
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
 * @return {number} a unique pointer number
 */
function pointerId(obj) {
  let ptr = pointers.get(obj);
  if (!ptr) {
    ptr = currentAddress++;
    pointers.set(obj, ptr);
  }
  return ptr;
}
