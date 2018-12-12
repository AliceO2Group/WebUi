import {h} from '/js/src/index.js';

/**
 * @file Page to show form of a new environment (content and header)
 */

/**
 * Header of page for creating a new environment
 * No action/button for now, only page title
 * @param {Object} model
 * @return {vnode}
 */
export let header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'New environment')
  ]),
  h('.flex-grow text-right', [

  ])
];

/**
 * Simple form for creating a new environment
 * Shows error message if server failed the creation
 * Validation of data is made by Control server itself
 * @param {Object} model
 * @return {vnode}
 */
export let content = (model) => h('.scroll-y.absolute-fill', [
  h('form.m4.measure', {onsubmit: () => false}, [
    h('.form-group', [
      h('label', {for: 'rolesInput'}, 'Roles'),
      h('input.form-control', {
        id: 'rolesInput',
        type: 'text',
        placeholder: 'roles separated by comma',
        oninput: (e) => model.environment.setForm('workflowTemplate', e.target.value),
        value: model.environment.itemForm.roles
      }),
    ]),
    h('button.btn.btn-primary', {
      class: model.environment.itemNew.isLoading() ? 'loading' : '',
      disabled: model.environment.itemNew.isLoading(),
      onclick: () => model.environment.newEnvironment()
    }, 'Create'),
    model.environment.itemNew.match({
      NotAsked: () => null,
      Loading: () => null,
      Success: () => null,
      Failure: (error) => h('p.danger', error),
    })
  ])
]);
