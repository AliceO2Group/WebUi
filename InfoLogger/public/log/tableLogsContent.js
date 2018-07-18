import {h} from '/js/src/index.js';

import {severityClass, severityLabel} from './severityUtils.js';
import tableColGroup from './tableColGroup.js';

const ROW_HEIGHT = 18; // sync with CSS value

export default (model) => h('.tableLogsContent.scroll-y.flex-grow', tableContainerHooks(model),
  h('div', {style: {height: model.log.list.length * ROW_HEIGHT + 'px', position: 'relative'}},
    h('table.table-logs-content', {style: {position: 'absolute', top: model.log.scrollTop - (model.log.scrollTop % ROW_HEIGHT) + 'px'}},
      tableColGroup(model),
      h('tbody', [
        model.log.list.slice(Math.floor(model.log.scrollTop / ROW_HEIGHT), Math.floor(model.log.scrollTop / ROW_HEIGHT) + ((Math.floor(model.log.scrollHeight / ROW_HEIGHT) * 2) + 1)).map((row) => tableLogLine(model, row))
      ]),
    )
  ),
);

const tableLogLine = (model, row) => h('tr.row-hover', {id: 'row-' + pointerId(row), className: model.log.item === row ? 'row-selected' : '', onclick: () => model.log.setItem(row)}, [
  h('td.cell.text-center', {className: model.log.item === row ? null : severityClass(row.severity)}, row.severity),
  model.log.columns.date && h('td.cell.cell-bordered', model.timezone.format(row.timestamp, 'date')),
  model.log.columns.time && h('td.cell.cell-bordered', model.timezone.format(row.timestamp, 'time')),
  model.log.columns.hostname && h('td.cell.cell-bordered', row.hostname),
  model.log.columns.rolename && h('td.cell.cell-bordered', row.rolename),
  model.log.columns.pid && h('td.cell.cell-bordered', row.pid),
  model.log.columns.username && h('td.cell.cell-bordered', row.username),
  model.log.columns.system && h('td.cell.cell-bordered', row.system),
  model.log.columns.facility && h('td.cell.cell-bordered', row.facility),
  model.log.columns.detector && h('td.cell.cell-bordered', row.detector),
  model.log.columns.partition && h('td.cell.cell-bordered', row.partition),
  model.log.columns.run && h('td.cell.cell-bordered', row.run),
  model.log.columns.errcode && h('td.cell.cell-bordered', row.errcode),
  model.log.columns.errline && h('td.cell.cell-bordered', row.errline),
  model.log.columns.errsource && h('td.cell.cell-bordered', row.errsource),
  model.log.columns.message && h('td.cell.cell-bordered', {title: row.message}, row.message),
]);

// cycle hooks for .logs-container on "smart scrolling"
const tableContainerHooks = (model) => ({
  oncreate(vnode) {
    // report to model scrolling infos of .logs-container
    const onTableScroll = () => {
      const container = vnode.dom;
      const height = container.getBoundingClientRect().height;
      const scrollTop = container.scrollTop;
      model.log.setScrollTop(container.scrollTop, height);
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

  onupdate(vnode) {
    // awe want to scroll to `item`
    if (model.log.item && model.log.autoScrollToItem) {
      // give-up if already done (DOM memorize previous auto-scroll)
      // because DOM accepts only strings, we create a unique string identifier
      const itemId = String(pointerId(model.log.item));
      if (vnode.dom.dataset.selectedItemId === itemId) {
        return;
      }
      vnode.dom.dataset.selectedItemId = itemId;

      // scroll to an index * height of row, centered
      const index = model.log.list.indexOf(model.log.item);
      const positionRow = ROW_HEIGHT * index;
      const halfView = model.log.scrollHeight / 2;
      vnode.dom.scrollTo(0, positionRow - halfView);
    }
  },

  ondestroy(vnode) {
    // never forget to remove listeners when observer is destroyed
    vnode.dom.removeEventListener('scroll', vnode.dom.onTableScroll);
    window.removeEventListener('resize', vnode.dom.onTableScroll);
  }
});

let pointers = new WeakMap();
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
