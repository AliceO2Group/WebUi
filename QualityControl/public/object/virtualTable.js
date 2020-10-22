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

import {h, iconBarChart} from '/js/src/index.js';

let ROW_HEIGHT = 33.6;
let FONT = '';
/**
 * A table which only displays the rows visible to the user
 * @param {Object} model
 * @param {String} location - location of where the virtual table is used: main(default) / side
 * @return {vnode}
 */
export default function virtualTable(model, location = 'main') {
  ROW_HEIGHT = (location === 'side') ? 29.4 : 33.6;
  FONT = (location === 'side') ? '.f6' : '';
  return h('.flex-grow.flex-column', {
  }, [
    location !== 'side' && tableHeader(),
    h('.scroll-y.animate-width', tableContainerHooks(model),
      h('', maximumTableSizeStyling(model.object.searchResult.length),
        h(`table.table-logs-content.text-no-select.table.table-sm${FONT}`, scrollStyling(model), [
          h('tbody', [
            listLogsInViewportOnly(model, model.object.searchResult).map((item) => {
              console.log("MAI ADAUGAM " + JSON.stringify(item))
              return objectFullRow(model, item, location)
            })
          ])
        ])
      ))
  ]);
}

/**
 * Build a <tr> element based on the item given
 * @param {Object} model
 * @param {JSON} item - contains fields: <name>, [creatTime], [lastModified]
 * @param {String} location
 * @return {vnode}
 */
const objectFullRow = (model, item, location) =>
  h('tr.object-selectable', {
    key: item.name,
    title: item.name,
    onclick: () => model.object.select(item),
    ondblclick: () => {
      if (location === 'side') {
        model.layout.addItem(item.name);
      }
    },
    ondragstart: () => {
      if (location === 'side') {
        const newItem = model.layout.addItem(item.name);
        model.layout.moveTabObjectStart(newItem);
      }
    },
    ondragend: () => {
      if (location === 'side') {
        model.layout.moveTabObjectStop();
      }
    },
    class: item && item === model.object.selected ? 'table-primary' : '',
    draggable: location === 'side'
  }, [
    h('td.highlight.text-ellipsis', [
      iconBarChart(),
      ' ',
      item.name
    ]),
  ]);

/**
 * Create a table header separately so that it does not get included
 * in the virtual list scrolling events
 * @return {vnode}
 */
const tableHeader = () =>
  h('table.table.table-sm.text-no-select', {
    style: 'margin-bottom:0'
  }, h('thead', [
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
 * @param {Object} length
 * @return {JSON}
 */
const maximumTableSizeStyling = (length) => ({
  style: {
    height: length * ROW_HEIGHT + 'px',
    position: 'relative'
  }
});

/**
 * Returns an array of items that are visible to user, hidden top and hidden bottom items
 * are not present in this array output
 * ceil() and + 1 ensure we see top and bottom logs coming
 * @param {Object} model
 * @param {Array<JSON>} list
 * @return {Array.<JSON>}
 */
const listLogsInViewportOnly = (model, list) => {
  console.log("mi-a dat " + list.length)
  console.log(model.object.scrollHeight)
  console.log(Math.floor(model.object.scrollTop / ROW_HEIGHT) + Math.ceil(model.object.scrollHeight / ROW_HEIGHT) + 1)
  console.log(list.slice(
    Math.floor(model.object.scrollTop / ROW_HEIGHT),
    Math.floor(model.object.scrollTop / ROW_HEIGHT) + Math.ceil(model.object.scrollHeight / ROW_HEIGHT) + 1))
  return list.slice(
    Math.floor(model.object.scrollTop / ROW_HEIGHT),
    Math.floor(model.object.scrollTop / ROW_HEIGHT) + Math.ceil(model.object.scrollHeight / ROW_HEIGHT) + 1
  )
};

/**
 * Hooks of .tableLogsContent for "smart scrolling"
 * This notifies model of its size and scrolling position to compute item to draw
 * It is also changing the size of the table in case a plot needs to be drawn
 * @param {Object} model
 * @param {Object} location
 * @return {Object} object containing hooks
 */
const tableContainerHooks = (model) => ({
  style: {
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
     * This handler allow to notify model of element scrolling change (.tableLogsContent)
     */
    const onTableScroll = () => {
      const container = vnode.dom;
      const height = container.getBoundingClientRect().height;
      console.log("container");
      console.log(container);
      console.log(container.getBoundingClientRect().height);
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
