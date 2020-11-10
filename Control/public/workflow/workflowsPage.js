/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

import {h, iconReload} from '/js/src/index.js';
import revisionPanel from './panels/revision/revisionPanel.js';
import basicVarsPanel from './panels/variables/basicPanel.js';
import advancedVarsPanel from './panels/variables/advancedPanel.js';
import flpSelectionPanel from './panels/flps/flpSelectionPanel.js';
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
    h('.w-40.ph2.flex-column', [
      h('h5.bg-gray-light.p2.panel-title.w-100', 'Select Template'),
      h('.form-group.p3.panel.w-100.flex-column', [
        repositoryDropdownList(model.workflow, repoList),
        revisionPanel(model.workflow, templatesMap, model.workflow.form.repository),
        templatesPanel(model.workflow, templatesMap),
      ])
    ]),
    workflowSettingsPanels(model.workflow)
  ]),
  actionableCreateEnvironment(model),
];


/**
 * Creates multiple panels with the purpose of configuring
 * the to be created environment
 * @param {Object} workflow
 * @return {vnode}
 */
const workflowSettingsPanels = (workflow) =>
  h('.w-60.ph2.flex-column', [
    flpSelectionPanel(workflow),
    basicVarsPanel(workflow),
    advancedVarsPanel(workflow)
  ]);


/**
 * Method which creates a dropdown of repositories
 * @param {Object} workflow
 * @param {Array<JSON>} repoList
 * @return {vnode}
 */
const repositoryDropdownList = (workflow, repoList) =>
  h('.text-left.w-100', [ // Dropdown Repositories
    h('h5', 'Repository:'),
    h('.flex-row', [
      h('select.form-control', {
        style: 'cursor: pointer; width: 85%;',
        onchange: (e) => workflow.setRepository(e.target.value)
      }, [
        repoList.map((repository) => repository.name)
          .map((repository) => h('option', {
            selected: repository === workflow.form.repository ? true : false,
            value: repository
          }, repository))
      ]),
      h('.text-right', {style: 'width:15%'},
        h('button.btn', {
          title: 'Refresh repositories',
          class: workflow.refreshedRepositories.isLoading() ? 'loading' : '',
          disabled: workflow.refreshedRepositories.isLoading(),
          onclick: () => workflow.refreshRepositories()
        }, iconReload())
      )
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
  h('.text-left.w-100', [ // Dropdown Template
    h('h5', {style: '', for: ''}, 'Workflow:'),
    h('.shadow-level1.pv1',
      Object.values(templatesMap[repository][revision]).map((template) =>
        h('a.menu-item.w-wrapped', {
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
