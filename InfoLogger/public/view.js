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

import {h, notification} from '/js/src/index.js';

import tableFilters from './logFilter/tableFilters.js';
import commandFilters from './logFilter/commandFilters.js';
import commandLogs from './log/commandLogs.js';
import statusBar from './log/statusBar.js';
import inspector from './log/inspector.js';
import tableLogsHeader from './log/tableLogsHeader.js';
import tableLogsContent from './log/tableLogsContent.js';
import tableLogsScrollMap from './log/tableLogsScrollMap.js';
import aboutComponent from './about/about.component.js';

// The view
export default (model) => [
  notification(model.notification),
  h('.flex-column absolute-fill', [
    h('.shadow-level2', [
      h('header.p1.flex-row.f7', [
        h('', commandLogs(model)),
        h('.flex-grow',
          {
            style: 'display: flex; flex-direction:row-reverse;'
          }, commandFilters(model)),
      ]),
      h('header.f7', tableFilters(model)),
    ]),
    h('div.flex-grow.flex-row.shadow-level0.logs-container', [
      aboutComponent(model),
      logsTable(model),
      inspectorSide(model)
    ]),
    h('footer.f7.ph1', [
      statusBar(model)
    ]),
  ]),
];

/**
 * Component which will display a virtual table containing the logs filtered by the user
 * @param {Object} model
 * @return {vnode}
 */
const logsTable = (model) =>
  h('main.flex-grow.flex-column.transition-background-color', {
    className: (model.log.queryResult.isLoading()) ? 'bg-gray' : ''
  }, [
    // table fixed header
    tableLogsHeader(model),
    // table scrollable content
    h('.flex-row.flex-grow.logs-content', [
      tableLogsContent(model),
      tableLogsScrollMap(model),
    ])
  ]);

/**
* Component which will display information about the log selected by the user
* @param {Object} model
* @return {vnode}
*/
const inspectorSide = (model) =>
  h('aside.sidebar', {style: {width: model.inspectorEnabled ? '' : '0rem'}}, [
    h('.sidebar-content.scroll-y', [
      inspector(model)
    ])
  ]);
