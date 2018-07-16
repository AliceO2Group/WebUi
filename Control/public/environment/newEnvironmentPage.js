import {h, switchCase} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import showTableList from '../common/showTableList.js';

/**
 * @file Page to show form of a new environment (content and header)
 */

export let header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'New environment')
  ]),
  h('.flex-grow text-right', [

  ])
];

// Validation of data is made by Control server itself
export let content = (model) => h('.scroll-y.absolute-fill', [
  h('form.m4.measure', {onsubmit: () => false}, [
    h('.form-group', [
      h('label', {for: 'rolesInput'}, 'Roles'),
      h('input.form-control', {
        id: 'rolesInput',
        type: 'text',
        placeholder: 'roles separated by comma',
        oninput: (e) => model.environment.setForm('roles', e.target.value),
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
