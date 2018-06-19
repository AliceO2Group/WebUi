import {h} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import switchCase from '../common/switchCase.js';
import showTableList from '../common/showTableList.js';

export let header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'New environment')
  ]),
  h('.flex-grow text-right', [

  ])
];

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
    switchCase(model.environment.itemNew.getState(), {
      'NOT_ASKED': () => null,
      'LOADING': () => null,
      'SUCCESS': () => null,
      'FAILURE': () => h('p.danger', model.environment.itemNew.getPayload()),
    })()
  ])
]);
