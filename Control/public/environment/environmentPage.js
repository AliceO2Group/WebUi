import {h, iconTrash} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import showTableItem from '../common/showTableItem.js';
import showTableList from '../common/showTableList.js';
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
    Success: (data) => showContent(model, data.environment),
    Failure: (error) => pageError(error),
  })
]);

/**
 * Show all properties of environment and buttons for its actions at bottom
 * @param {Object} model
 * @param {Environment} item - environment to show on this page
 * @return {vnode}
 */
const showContent = (model, item) => [
  showControl(model.environment, item),
  h('.m2', h('h4', 'Details')),
  showTableItem(item),
  h('.m2', h('h4', 'Tasks')),
  showTableList(item.tasks),
];

/**
 * List of buttons, each one is an action to do on the current environment `item`
 * @param {Object} environment
 * @param {Environment} item - environment to show on this page
 * @return {vnode}
 */
const showControl = (environment, item) => h('.m2 .p2.shadow-level2', [
  h('h4', 'Control'),
  h('div.flex-row',
    h('div.flex-grow',
      [
        controlButton('', environment, item, 'START', 'START_ACTIVITY', 'CONFIGURED'), ' ',
        controlButton('', environment, item, 'STOP', 'STOP_ACTIVITY', 'RUNNING'), ' ',
        controlButton('', environment, item, 'CONFIGURE', 'CONFIGURE', 'STANDBY'), ' ',
        controlButton('', environment, item, 'RESET', 'RESET', 'CONFIGURED'), ' '
      ]
    ),
    h('div.flex-grow.text-right',
      h('button.btn.btn-danger',
        {
          class: environment.itemControl.isLoading() ? 'loading' : '',
          disabled: environment.itemControl.isLoading(),
          onclick: () => confirm('Are you sure to delete this environment?')
            && environment.destroyEnvironment({id: item.id})
        },
        iconTrash()
      ),
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
 * @param {string} stateToDisable - state in which button should be disabled
 * @return {vnode}
 */
const controlButton = (buttonType, environment, item, label, type, stateToDisable) =>
  h(`button.btn${buttonType}`,
    {
      class: environment.itemControl.isLoading() ? 'loading' : '',
      disabled: environment.itemControl.isLoading() || item.state !== stateToDisable,
      onclick: () => environment.controlEnvironment({id: item.id, type: type}),
      title: `'${label}' cannot be used in state '${item.state}'`
    },
    label
  );
