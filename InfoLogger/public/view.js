import {h, switchCase, frameDebouncer} from '/js/src/index.js';

import tableFilters from './logFilter/tableFilters.js';
import commandFilters from './logFilter/commandFilters.js';
import commandLogs from './log/commandLogs.js';
import statusBar from './log/statusBar.js';
import inspector from './log/inspector.js';
import tableLogsHeader from './log/tableLogsHeader.js';
import tableLogsContent from './log/tableLogsContent.js';
import tableLogsScrollMap from './log/tableLogsScrollMap.js';

// The view
export default (model) => h('.flex-column absolute-fill', [
  h('.shadow-level2', [
    h('header.f7', [
      tableFilters(model)
    ]),
    h('header.p1.flex-row.f7', [
      h('', [
        commandLogs(model)
      ]),
      h('.flex-grow.text-right', [
        commandFilters(model)
      ]),
    ]),
  ]),
  h('div.flex-grow.flex-row.shadow-level0.logs-container', [
    h('main.flex-grow.flex-column.transition-background-color', {className: (model.log.queryResult.isLoading()) ? 'bg-gray' : ''}, [
      // table fixed header
      tableLogsHeader(model),

      // table scrollable content
      h('.flex-row.flex-grow.logs-content', [
        tableLogsContent(model),
        tableLogsScrollMap(model),
      ])
    ]),
    h('aside.sidebar', {style: {width: model.inspectorEnabled ? '' : '0rem'}}, [
      h('.sidebar-content.scroll-y', [
        inspector(model)
      ])
    ]),
  ]),
  h('footer.f7.ph1', [
    statusBar(model)
  ]),
]);
