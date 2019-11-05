import {h, iconChevronBottom, iconChevronTop, iconCircleX} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import showTableItem from '../common/showTableItem.js';
/**
 * @file Page to show 1 environment (content and header)
 */

/**
 * Header of page showing one environment
 * Only page title with no action
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'Environment details')
  ]),
  h('.flex-grow text-right', [

  ])
];

/**
 * Content page showing one environment
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill', [
  model.environment.item.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (data) => showContent(model.environment, data.environment),
    Failure: (error) => pageError(error),
  })
]);

/**
 * Show all properties of environment and buttons for its actions at bottom
 * @param {Object} environment
 * @param {Environment} item - environment to show on this page
 * @return {vnode}
 */
const showContent = (environment, item) => [
  showControl(environment, item),
  item.state === 'RUNNING' &&
  h('.m2.flex-row',
    {
      style: 'height: 10em;'
    },
    [
      h('.grafana-font.m1.flex-column',
        {
          style: 'width: 15%;'
        },
        [
          h('', {style: 'height:40%'}, 'Run Number'),
          h('',
            h('.badge.bg-success.white',
              {style: 'font-size:45px'},
              item.currentRunNumber)
          )
        ]
      ),
      environment.plots.match({
        NotAsked: () => h('.w-100.text-center.grafana-font', 'Grafana plots were not loaded, please refresh the page'),
        Loading: () => null,
        Success: (data) => showEmbeddedGraphs(data),
        Failure: () => h('.w-100.text-center.grafana-font',
          'Grafana plots were not loaded, please contact an administrator'
        ),
      })
    ]
  ),
  showEnvDetailsTable(item),
  h('.m2', [
    h('h4', 'Tasks'),
    h('.flex-row.flex-grow',
      h('.flex-grow',
        showEnvTasksTable(environment, item.tasks)
      )
    ),
  ]),
];

/**
 * Method to display plots from Grafana
 * @param {Array<String>} data
 * @return {vnode}
 */
const showEmbeddedGraphs = (data) =>
  [
    h('.flex-row',
      {style: 'width:30%;'},
      [
        h('iframe.w-50',
          {
            src: data[0],
            style: 'height: 100%; border: 0;'
          }
        ),
        h('iframe.w-50',
          {
            src: data[1],
            style: 'height: 100%; border: 0;'
          }
        )
      ]),
    // Large Plot
    h('iframe.flex-grow',
      {
        src: data[2],
        style: 'height: 100%; border: 0'
      }
    )
  ];

/**
 * Table to display Environment details
 * @param {Object} item - object to be shown
 * @return {vnode} table view
 */
const showEnvDetailsTable = (item) =>
  h('.m2.mv4.shadow-level1',
    h('table.table', [
      h('tbody', [
        h('tr', [
          h('th', 'Number of Tasks'),
          h('td', item.tasks.length)
        ]),
        h('tr', [
          h('th', 'ID'),
          h('td', item.id)
        ]),
        h('tr', [
          h('th', 'Created'),
          h('td', new Date(item.createdWhen).toLocaleString())
        ]),
        h('tr', [
          h('th', 'State'),
          h('td',
            {
              class: item.state === 'RUNNING' ? 'success' : (item.state === 'CONFIGURED' ? 'warning' : ''),
              style: 'font-weight: bold;'
            },
            item.state)
        ]),
        h('tr', [
          h('th', 'Root Role'),
          h('td', item.rootRole)
        ])
      ])
    ]
    )
  );

/**
 * List of buttons, each one is an action to do on the current environment `item`
 * @param {Object} environment
 * @param {Environment} item - environment to show on this page
 * @return {vnode}
 */
const showControl = (environment, item) => h('.mv2.pv3.ph2', [
  h('div.flex-row',
    h('div.flex-grow',
      [
        controlButton('.btn-success', environment, item, 'START', 'START_ACTIVITY', 'CONFIGURED'), ' ',
        controlButton('.btn-danger', environment, item, 'STOP', 'STOP_ACTIVITY', 'RUNNING'), ' ',
        controlButton('.btn-warning', environment, item, 'CONFIGURE', 'CONFIGURE', 'STANDBY'), ' ',
        controlButton('', environment, item, 'RESET', 'RESET', 'CONFIGURED'), ' '
      ]
    )
  ),
  environment.itemControl.match({
    NotAsked: () => null,
    Loading: () => null,
    Success: (_data) => null,
    Failure: (error) => h('p.danger', error),
  })
]);

/**
 * Makes a button to toggle severity
 * @param {string} buttonType
 * @param {Object} environment
 * @param {Object} item
 * @param {string} label - button's label
 * @param {string} type - action
 * @param {string} stateToHide - state in which button should not be displayed
 * @return {vnode}
 */
const controlButton = (buttonType, environment, item, label, type, stateToHide) =>
  h(`button.btn${buttonType}`,
    {
      class: environment.itemControl.isLoading() ? 'loading' : '',
      disabled: environment.itemControl.isLoading(),
      style: item.state !== stateToHide ? 'display: none;' : '',
      onclick: () => {
        environment.controlEnvironment({id: item.id, type: type});
      },
      title: item.state !== stateToHide ? `'${label}' cannot be used in state '${item.state}'` : label
    },
    label
  );

/**
 * Method to create and display a table with tasks details
 * @param {Object} environment
 * @param {Array<Object>} tasks
 * @return {vnode}
 */
const showEnvTasksTable = (environment, tasks) => h('.scroll-auto.shadow-level1', [
  h('table.table.table-sm', {style: 'margin:0'}, [
    h('thead',
      h('tr',
        [
          ['Name', 'Locked', 'Status', 'State', 'Host Name', 'Args', 'More']
            .map((header) => h('th', {style: 'text-align: center'}, header))
        ]
      )
    ),
    h('tbody', [
      tasks.map((task) => [h('tr', [
        h('td', {style: 'text-align:left'}, task.name),
        h('td', {style: 'text-align:center'}, task.locked),
        h('td', {style: 'text-align:center'}, task.status),
        h('td', {
          class: (task.state === 'RUNNING' ?
            'success' : (task.state === 'CONFIGURED' ? 'warning' : '')),
          style: 'font-weight: bold; text-align:center'
        }, task.state),
        h('td', {style: 'text-align:center'}, task.deploymentInfo.hostname),
        environment.task.list[task.taskId] && environment.task.list[task.taskId].match({
          NotAsked: () => null,
          Loading: () => h('td', {style: 'font-size: 0.25em;text-align:center'}, pageLoading()),
          Success: (data) => h('td', {style: 'text-align:left'}, data.arguments),
          Failure: (_error) => h('td', {style: 'text-align:center', title: 'Could not load arguments'}, iconCircleX()),
        }),
        h('td', {style: 'text-align:center'},
          h('button.btn.btn-default', {
            title: 'More Details',
            onclick: () => environment.task.toggleTaskView(task.taskId),
          }, environment.task.openedTasks[task.taskId] ? iconChevronTop() : iconChevronBottom())
        ),
      ]),
      environment.task.openedTasks[task.taskId] && environment.task.list[task.taskId] &&
      addTaskDetailsTable(environment, task),
      ]),
    ])
  ])
]);

/**
 *  Method to display an expandable table with details about a selected task if request was successful
 *  Otherwise display loading or error message
 * @param {Object} environment
 * @param {JSON} task
 * @return {vnode}
 */
const addTaskDetailsTable = (environment, task) => h('tr', environment.task.list[task.taskId].match({
  NotAsked: () => null,
  Loading: () => h('td.shadow-level3.m5', {style: 'font-size: 0.25em; text-align: center;', colspan: 7}, pageLoading()),
  Success: (data) => h('td', {colspan: 7}, showTableItem(data)),
  Failure: (_error) => h('td.shadow-level3.m5',
    {style: 'text-align: center;', colspan: 7, title: 'Could not load arguments'},
    [iconCircleX(), ' ', _error]),
}));
