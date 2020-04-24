import {h, iconBarChart} from '/js/src/index.js';

const ROW_HEIGHT = 33.6;

/**
 * Shows a line <tr> for search mode (no indentation)
 * @param {Object} model
 * @return {vnode}
 */
export default function searchTable(model) {
  return h('.flex-grow', [
    tableHeader(),
    h('.absolute-fill.scroll-y.animate-width', tableContainerHooks(model),
      h('', maximumTableSizeStyling(model),
        h('table.table-logs-content.text-no-select.table.table-sm', scrollStyling(model), [
          h('tbody', [
            listLogsInViewportOnly(model).map((item) => {
              const path = item.name;
              const color = item.quality === 'good' ? 'success' : 'danger';
              const className = item && item === model.object.selected ? 'table-primary' : '';

              return h('tr.object-selectable', {
                key: path,
                title: path,
                onclick: () => model.object.select(item),
                class: className
              }, [
                h('td.highlight', [
                  iconBarChart(),
                  ' ',
                  item.name
                ]),
                h('td.highlight', {class: color}, item.quality),
              ]);
            })
          ])
        ])
      ))
  ]);
}

/**
 * Create a table header separetly so that it does not get included
 * in the virtual list
 * @return {vnode}
 */
const tableHeader = () =>
  h('table.table.table-sm.text-no-select',
    h('thead', [
      h('tr', [h('th', 'Name')])
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
 */
const maximumTableSizeStyling = (model) => ({
  style: {
    height: model.object.searchResult.length * ROW_HEIGHT + 'px',
    position: 'relative'
  }
});

/**
 * Returns an array of logs that are indeed visible to user, hidden top and hidden bottom logs
 * are not present in this array output
 * ceil() and + 1 ensure we see top and bottom logs coming
 * @param {Object} model
 * @return {Array.<Log>}
 */
const listLogsInViewportOnly = (model) => model.object.searchResult.slice(
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
