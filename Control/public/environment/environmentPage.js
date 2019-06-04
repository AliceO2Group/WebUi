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
  showControl(model, item),
  h('.m2', h('h4', 'Details')),
  showTableItem(item),
  h('.m2', h('h4', 'Tasks')),
  showTableList(item.tasks),
];

/**
 * List of buttons, each one is an action to do on the current environment `item`
 * @param {Object} model
 * @param {Environment} item - environment to show on this page
 * @return {vnode}
 */
const showControl = (model, item) => h('.m2 .p2', [
  h('h4', 'Control'),
  h('div.flex-row',
    h('div.flex-grow',
      [
        h('button.btn',
          {
            class: model.environment.itemControl.isLoading() ? 'loading' : '',
            disabled: model.environment.itemControl.isLoading(),
            onclick: () => model.environment.controlEnvironment({id: item.id, type: 'START_ACTIVITY'})
          },
          'START'
        ),
        ' ',
        h('button.btn',
          {
            class: model.environment.itemControl.isLoading() ? 'loading' : '',
            disabled: model.environment.itemControl.isLoading(),
            onclick: () => model.environment.controlEnvironment({id: item.id, type: 'STOP_ACTIVITY'})
          },
          'STOP'
        ),
        ' ',
        h('button.btn',
          {
            class: model.environment.itemControl.isLoading() ? 'loading' : '',
            disabled: model.environment.itemControl.isLoading(),
            onclick: () => model.environment.controlEnvironment({id: item.id, type: 'CONFIGURE'})
          },
          'CONFIGURE'
        ),
        ' ',
        h('button.btn',
          {
            class: model.environment.itemControl.isLoading() ? 'loading' : '',
            disabled: model.environment.itemControl.isLoading(),
            onclick: () => model.environment.controlEnvironment({id: item.id, type: 'RESET'})
          },
          'RESET'
        )
      ]
    ),
    h('div.flex-grow.text-right',
      h('button.btn.btn-danger',
        {
          class: model.environment.itemControl.isLoading() ? 'loading' : '',
          disabled: model.environment.itemControl.isLoading(),
          onclick: () => confirm('Are you sure to delete this environment?')
            && model.environment.destroyEnvironment({id: item.id})
        },
        iconTrash()
      ),
    )
  ),
  model.environment.itemControl.match({
    NotAsked: () => null,
    Loading: () => null,
    Success: (_data) => null,
    Failure: (error) => h('p.danger', error),
  })
]);
