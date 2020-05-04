import {h, iconBarChart} from '/js/src/index.js';

const ROW_HEIGHT = 33.6;

/**
 * Shows a line <tr> for search mode (no indentation)
 * @param {Object} model
 * @return {vnode}
 */
export default function virtualTable(model) {
  return h('.flex-grow', {
  }, [
    tableHeader(),
    h('.absolute-fill.scroll-y.animate-width', tableContainerHooks(model),
      h('', maximumTableSizeStyling(model),
        h('table.table-logs-content.text-no-select.table.table-sm', scrollStyling(model), [
          h('tbody', [
            listLogsInViewportOnly(model, model.object.searchResult).map((item) => objectFullRow(model, item))
          ])
        ])
      ))
  ]);
}

/**
 * Build a <tr> element based on the item given
 * @param {Object} model
 * @param {JSON} item - contains fields: name, creatTime, lastModified
 * @return {vnode}
 */
const objectFullRow = (model, item) =>
  h('tr.object-selectable', {
    key: item.name,
    title: item.name,
    onclick: () => model.object.select(item),
    class: item && item === model.object.selected ? 'table-primary' : ''
  }, [
    h('td.highlight', [
      iconBarChart(),
      ' ',
      item.name
    ]),
  ]);

/**
 * Create a table header separately so that it does not get included
 * in the virtual list
 * @return {vnode}
 */
const tableHeader = () =>
  h('table.table.table-sm.text-no-select',
    h('thead', [
      h('tr', [
        h('th', 'Name'),
      ])
    ])
  );

/**
 * Set styles of the floating table and its position inside the big div .tableLogsContentPlaceholder
 * @param {Object} model
 * @return {Object} properties of floating table
 */
const scrollStyling = (model) => ({
  style: {
    position: 'absolute',
    top: model.object.scrollTop - (model.object.scrollTop % ROW_HEIGHT) + 'px'
  }
});

/**
 * Style attributes for panel representing the maximum table size
 * Needed for scrollbar to be proportional with the number of elements
 * @param {Object} model
 * @return {JSON}
 */
const maximumTableSizeStyling = (model) => ({
  style: {
    height: model.object.searchResult.length * ROW_HEIGHT + 'px',
    position: 'relative'
  }
});

/**
 * Returns an array of items that are visible to user, hidden top and hidden bottom logs
 * are not present in this array output
 * ceil() and + 1 ensure we see top and bottom logs coming
 * @param {Object} model
 * @param {Array<JSON>} list
 * @return {Array.<JSON>}
 */
const listLogsInViewportOnly = (model, list) => list.slice(
  Math.floor(model.object.scrollTop / ROW_HEIGHT),
  Math.floor(model.object.scrollTop / ROW_HEIGHT) + Math.ceil(model.object.scrollHeight / ROW_HEIGHT) + 1
);


/**
 * Hooks of .tableLogsContent for "smart scrolling"
 * This notifies model of its size and scrolling position to compute logs to draw
 * @param {Object} model
 * @return {Object} object containing hooks
 */
const tableContainerHooks = (model) => ({
  style: {
    width: model.object.selected ? '50%' : '100%',
    top: '2em',
    bottom: '1.4em'
  },
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
      model.object.setScrollTop(scrollTop, height);
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
   * Hook. Remove listeners when element is destroyed
   * @param {vnode} vnode
   */
  ondestroy(vnode) {
    vnode.dom.removeEventListener('scroll', vnode.dom.onTableScroll);
    window.removeEventListener('resize', vnode.dom.onTableScroll);
  }
});
