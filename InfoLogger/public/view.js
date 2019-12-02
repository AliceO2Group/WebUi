import {h, notification} from '/js/src/index.js';

import tableFilters from './logFilter/tableFilters.js';
import commandFilters from './logFilter/commandFilters.js';
import commandLogs from './log/commandLogs.js';
import statusBar from './log/statusBar.js';
import inspector from './log/inspector.js';
import tableLogsHeader from './log/tableLogsHeader.js';
import tableLogsContent from './log/tableLogsContent.js';
import tableLogsScrollMap from './log/tableLogsScrollMap.js';
import loadingAnimation from './common/loadingAnimation.js';
import errorComponent from './common/errorComponent.js';

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
      frameworkInfoSide(model),
      logsTable(model),
      inspectorSide(model)
    ]),
    h('footer.f7.ph1', [
      statusBar(model)
    ]),
  ]),
];

/**
 * Component which will display information about the framework of InfoLogger
 * @param {Object} model
 * @return {vnode}
 */
const frameworkInfoSide = (model) =>
  h('aside.sidebar', {style: {width: model.frameworkInfoEnabled ? '' : '0rem'}}, [
    h('.sidebar-content.scroll-y.p1.text-center', [
      model.frameworkInfo.match({
        NotAsked: () => null,
        Loading: () => h('.f1', loadingAnimation()),
        Success: (data) => showContent(data),
        Failure: (error) => errorComponent(error),
      })
    ])
  ]);

/**
* Display a table with information about infologger framework
* @param {Object} item
* @return {vnode}
*/
const showContent = (item) =>
  Object.keys(item).map((columnName) => [
    h('table.table.f7.shadow-level1',
      h('tbody', [
        h('tr',
          h('th.w-50', {style: 'text-decoration: underline'}, columnName.charAt(0).toUpperCase() + columnName.slice(1)),
          h('th', '')
        ),
        Object.keys(item[columnName]).map((name) =>
          h('tr', [
            h('th.w-25', name),
            h('td', JSON.stringify(item[columnName][name])),
          ]))
      ])
    )
  ]);


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
