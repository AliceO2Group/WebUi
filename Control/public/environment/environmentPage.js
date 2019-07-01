import {h} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import parseObject from './../common/utils.js';
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
  item.state === 'RUNNING' && environment.plots.match({
    NotAsked: () => null,
    Loading: () => null,
    Success: (data) => showEmbeddedGraphs(data),
    Failure: () => null,
  }),
  showEnvDetailsTable(item),
  h('.m2.p2', [
    h('h4', 'Tasks'),
    h('.flex-row.flex-grow',
      h('.flex-grow', {},
        displayTableOfTasks(environment, item.tasks, [
          (event, item) => {
            //show/hide component
            environment.getTask({taskId: item.taskId});
          }]
        )
      )
    )
  ]),
];

/**
 * Method to display pltos from Graphana
 * @param {Array<String>} data
 * @return {vnode}
 */
const showEmbeddedGraphs = (data) =>
  h('.m2',
    h('h4', 'Details'),
    h('.flex-row',
      {
        style: 'height: 15em;'
      },
      [
        h('.w-33.flex-row', [
          h('.w-50',
            h('iframe',
              {
                src: data[0],
                style: 'width: 100%; height: 100%; border: 0'
              }
            )),
          h('.w-50',
            h('iframe',
              {
                src: data[1],
                style: 'width: 100%; height: 100%; border: 0'
              }
            ))
        ]),
        // Large Plot
        h('.flex-grow',
          h('iframe',
            {
              src: data[2],
              style: 'width: 100%; height: 100%; border: 0'
            }
          )
        )])
  );

/**
 * Table to display Environment details
 * @param {Object} item - object to be shown
 * @return {vnode} table view
 */
const showEnvDetailsTable = (item) =>
  h('.pv3.m2',
    h('table.table', [
      h('tbody', [
        item.currentRunNumber && h('tr', [
          h('th', 'Current Run Number'),
          h('td',
            {
              class: 'badge bg-success white'
            },
            item.currentRunNumber
          )
        ]),
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
 * Method to create and display the a table with tasks
 * @param {Object} environment
 * @param {Array<Object>} list
 * @param {Array<Actions>} actions
 * @return {vnode}
 */
const displayTableOfTasks = (environment, list, actions) => h('', [
  h('table.table.table-sm', [
    h('thead', [
      h('tr',
        [
          list.length > 0 && Object.keys(list[0]).map(
            (columnName) => h('th', {style: 'text-align:center'}, columnName)),
          actions && h('th.text-center', {style: 'text-align:center'}, 'actions')
        ]
      )
    ]),
    h('tbody', list.map((item) => [h('tr', [
      Object.keys(item).map(
        (columnName) => typeof item[columnName] === 'object'
          ? h('td', parseObject(item[columnName], columnName))
          : h('td',
            columnName === 'state' && {
              class: (item[columnName] === 'RUNNING' ? 'success' : (item[columnName] === 'CONFIGURED' ? 'warning' : '')),
              style: 'font-weight: bold;'
            },
            item[columnName]
          )
      ),
      actions && h('td.btn-group',
        h('button.btn.btn-primary', {onclick: (event) => actions[0](event, item)}, 'Details')),
    ]),
    environment.currentTask.match({
      NotAsked: () => null,
      Loading: () => null,
      Success: (data) => data.taskId === item.taskId && displayTaskDetails(data),
      Failure: (error) =>null,
    })
    ],
    )),
  ]
  )
]);

/**
 * Method to display an expandable area with details about a selected task
 * @param {Object} task
 * @return {vnode}
 */
const displayTaskDetails = (task) =>
  h('tr.m5',
    h('td', {colspan: 8}, showTableItem(task))
  );
