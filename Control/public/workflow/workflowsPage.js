import {h, iconReload, iconTrash, iconPlus, info} from '/js/src/index.js';
import revisionPanel from './revisionPanel.js';
import flpSelectionPanel from './flpSelectionPanel.js';
import errorComponent from './../common/errorComponent.js';
import pageLoading from '../common/pageLoading.js';
import errorPage from '../common/errorPage.js';
/**
 * @file Page to show a form for creating a new environment
 * from existing templates
 */

/**
 * Header of page showing form for creating a new environment
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => h('h4.w-100 text-center', 'New Environment');

/**
* Form with inputs for creating a new environment
Check that a lits of repositories was retrieved successfully
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill.text-center.p2', [
  model.workflow.repoList.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (repoList) => (repoList.length === 0)
      ? h('h3.m4', ['No repositories found.']) : showTemplatesValidation(model, repoList.repos),
    Failure: (error) => errorPage(error),
  })
]);

/**
 * Check that after repositories were requested, templates were loaded successfully
 * @param {Object} model
 * @param {Array<JSON>} repoList - list of Repositories
 * @return {vnode}
 */
const showTemplatesValidation = (model, repoList) =>
  model.workflow.templatesMap.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Failure: (error) => errorPage(error),
    Success: (templatesMap) => (Object.keys(templatesMap).length === 0)
      ? h('h3.m4', ['No templates/revisions found.']) : showNewEnvironmentForm(model, repoList, templatesMap)
  });

/**
* Create a form for the user to select inputs for a new environment
* @param {Object} model
* @param {RemoteData<Array<JSON>>} repoList
* @param {RemoteData<Map<String, JSON>>} templatesMap
* @return {vnode}
*/
const showNewEnvironmentForm = (model, repoList, templatesMap) => [
  h('.flex-row', [
    h('.w-50.ph2.flex-column', [
      h('h5.bg-gray-light.p2.panel-title.w-100', 'Select Template'),
      h('.form-group.p3.panel.w-100.flex-column', {
        onclick: () => model.workflow.setRevisionInputDropdownVisibility(false),
      }, [
        repositoryDropdownList(model.workflow, repoList),
        revisionPanel(model.workflow, templatesMap, model.workflow.form.repository),
        templatesPanel(model.workflow, templatesMap),
      ])
    ]),
    extraVariablePanel(model.workflow)
  ]),
  actionableCreateEnvironment(model),
];

/**
 * Method which creates a dropdown of repositories
 * @param {Object} workflow
 * @param {Array<JSON>} repoList
 * @return {vnode}
 */
const repositoryDropdownList = (workflow, repoList) =>
  h('.m2.text-left.w-100', [ // Dropdown Repositories
    h('h5', 'Repository:'),
    h('', {style: 'display: flex; flex-direction: row'}, [
      h('select.form-control', {
        style: 'cursor: pointer',
        onchange: (e) => workflow.setRepository(e.target.value)
      }, [
        repoList.map((repository) => repository.name)
          .map((repository) => h('option', {
            selected: repository === workflow.form.repository ? true : false,
            value: repository
          }, repository))
      ]),
      h('button.btn', {
        title: 'Refresh repositories',
        class: workflow.refreshedRepositories.isLoading() ? 'loading' : '',
        disabled: workflow.refreshedRepositories.isLoading(),
        onclick: () => workflow.refreshRepositories()
      }, iconReload())
    ])
  ]);

/**
 * Create the templates panel based on user's selection of revision
 * @param {RemoteData} workflow
 * @param {RemoteData<Map<String, JSON>>} templatesMap
 * @return {vnode}
 */
const templatesPanel = (workflow, templatesMap) =>
  (workflow.isRevisionCorrect() &&
    Object.values(templatesMap[workflow.form.repository][workflow.form.revision]).length !== 0) ?
    templateAreaList(workflow, templatesMap, workflow.form.repository, workflow.form.revision)
    : errorComponent('No templates found for this revision.');

/**
 * Method to create the template Area List
 * @param {Object} workflow
 * @param {RemoteData<Map<String, JSON>>} templatesMap
 * @param {string} repository
 * @param {string} revision
 * @return {vnode}
 */
const templateAreaList = (workflow, templatesMap, repository, revision) =>
  h('.m2.text-left.w-100', [ // Dropdown Template
    h('h5', {style: '', for: ''}, 'Template:'),
    h('.shadow-level1.pv1',
      Object.values(templatesMap[repository][revision]).map((template) =>
        h('a.menu-item', {
          className: workflow.form.template === template ? 'selected' : null,
          onclick: () => workflow.setTemplate(template)
        }, template))
    )
  ]);

/**
 * Create a panel with:
 * * a button which creates environment
 * * a text area in case of failure
 * @param {Object} model
 * @return {vnode}
 */
const actionableCreateEnvironment = (model) =>
  h('.mv2', [
    model.environment.itemNew.match({
      NotAsked: () => null,
      Loading: () => null,
      Success: () => null,
      Failure: (error) => errorComponent(error),
    }),
    btnCreateEnvironment(model),
  ]);

/**
 * Create a panel to allow user to pass in extra variables
 * for creating a new environment
 * @param {Object} workflow
 * @return {vnode}
 */
const extraVariablePanel = (workflow) =>
  h('.w-50.ph2.flex-column', [
    h('h5.bg-gray-light.p2.panel-title.w-100', 'FLP Selection'),
    flpSelectionPanel(workflow),
    h('h5.bg-gray-light.p2.panel-title.w-100.flex-row', [
      h('.w-100', 'Environment variables'),
      h('a.ph1.actionable-icon', {
        href: 'https://github.com/AliceO2Group/ControlWorkflows',
        target: '_blank',
        title: 'Open Environment Variables Documentation'
      }, info())
    ]),
    addKVInputList(workflow),
    addKVInputPair(workflow),
  ]);

/**
 * Method to add a list of KV pairs added by the user
 * @param {Object} workflow
 * @return {vnode}
 */
const addKVInputList = (workflow) =>
  h('.w-100.p2.panel', Object.keys(workflow.form.variables).map((key) =>
    h('.w-100.flex-row.pv2.border-bot', {
    }, [
      h('.w-33.ph1.text-left', key),
      h('.ph1', {
        style: 'width: 60%',
      }, h('input.form-control', {
        type: 'text',
        value: workflow.form.variables[key],
        oninput: (e) => workflow.updateVariableValueByKey(key, e.target.value)
      })),
      h('.ph2.danger.actionable-icon', {
        onclick: () => workflow.removeVariableByKey(key)
      }, iconTrash())
    ])
  ));
/**
 * Add 2 input fields and a button for adding a new KV Pair
 * @param {Object} workflow
 * @return {vnode}
 */
const addKVInputPair = (workflow) => {
  let keyString = '';
  let valueString = '';
  return h('.form-group.p2.panel.w-100.flex-column', [
    h('.pv2.flex-row', [
      h('.w-33.ph1', {
      }, h('input.form-control', {
        type: 'text',
        placeholder: 'key',
        value: keyString,
        oninput: (e) => keyString = e.target.value.trim()
      })),
      h('.ph1', {
        style: 'width:60%;',
      }, h('input.form-control', {
        type: 'text',
        placeholder: 'value',
        value: valueString,
        oninput: (e) => valueString = e.target.value.trim()
      })),
      h('.ph2.actionable-icon', {
        title: 'Add (key,value) variable',
        onclick: () => workflow.addVariable(keyString, valueString)
      }, iconPlus())
    ]),
  ]);
};

/**
 * Method to add a button for creation of environment
 * @param {Object} model
 * @return {vnode}
 */
const btnCreateEnvironment = (model) => h('button.btn.btn-primary', {
  class: model.environment.itemNew.isLoading() ? 'loading' : '',
  disabled: model.environment.itemNew.isLoading() || !model.workflow.isInputSelected(),
  onclick: () => model.workflow.createNewEnvironment(),
  title: 'Create environment based on selected workflow'
}, 'Create');
