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

import {h, iconReload, info} from '/js/src/index.js';
import revisionPanel from './panels/revision/revisionPanel.js';
import {basicPanel} from './panels/variables/basicPanel.js';
import mainPanel from './panels/variables/mainPanel.js';
import advancedVarsPanel from './panels/variables/advancedPanel.js';
import flpSelectionPanel from './panels/flps/flpSelectionPanel.js';
import detectorsPanel from './panels/flps/detectorsPanel.js';
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
 * Check that a lits of repositories was retrieved successfully
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill.text-center.p2', [
  // detectorHeader(model),
  // h('.p2',
  model.workflow.repoList.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (repoList) => (repoList.repos.length === 0)
      ? h('h3.m4', ['No repositories found.']) : showNewEnvironmentForm(model, repoList.repos),
    Failure: (error) => errorPage(error),
  })
  // )
]);

/**
* Create a form for the user to select inputs for a new environment
* @param {Object} model
* @param {Array<JSON>} repoList
* @return {vnode}
*/
const showNewEnvironmentForm = (model, repoList) => [
  h('.flex-column', [
    h('.flex-row.w-100', {style: 'flex-wrap: wrap'}, [
      h('.template-selection.flex-column', [
        h('h5.bg-gray-light.p2.panel-title.w-100', 'Select Template'),
        h('.form-group.p2.panel.w-100.flex-column', [
          repositoryDropdownList(model.workflow, repoList),
          revisionPanel(model.workflow),
          model.workflow.revisions.length !== 0 &&
          templateAreaList(model.workflow, model.workflow.form.repository, model.workflow.form.revision)
        ]),
      ]),
      h('.template-selection', detectorsPanel(model.workflow)),
      h('.template-selection', flpSelectionPanel(model.workflow)),
    ]),
    model.workflow.form.template && workflowSettingsPanels(model.workflow)
  ]),
  actionsPanel(model),
];


/**
 * Creates multiple panels with the purpose of configuring
 * the to be created environment
 * @param {Object} workflow
 * @return {vnode}
 */
const workflowSettingsPanels = (workflow) => [
  Object.keys(workflow.selectedVarsMap).length > 0 ? h('.w-100.pv2.flex-row', mainPanel(workflow))
    : h('.w-100.flex-row', [
      basicPanel(workflow),
      advancedVarsPanel(workflow)
    ])
];

/**
 * Method which creates a dropdown of repositories
 * @param {Object} workflow
 * @param {Array<JSON>} repoList
 * @return {vnode}
 */
const repositoryDropdownList = (workflow, repoList) =>
  h('.text-left.w-100', [
    h('h5', 'Repository:'),
    h('.flex-row', [
      h('select.form-control', {
        style: 'cursor: pointer; width: 80%;',
        onchange: (e) => workflow.setRepository(e.target.value)
      }, [
        repoList.map((repository) => repository.name)
          .map((repository) => h('option', {
            selected: repository === workflow.form.repository ? true : false,
            value: repository
          }, repository))
      ]),
      h('.text-left.ph2', {style: 'width:13%'},
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
 * Create the template Area List treating the edge cases:
 * * loading
 * * error
 * * empty list of templates
 * * templates as expected
 * @param {Object} workflow
 * @param {String} repository
 * @param {String} revision
 * @return {vnode}
 */
const templateAreaList = (workflow, repository, revision) =>
  h('.text-left.w-100', [
    h('h5', 'Workflow:'),
    workflow.templates.match({
      NotAsked: () => null,
      Loading: () => h('.w-100.text-center', pageLoading(2)),
      Failure: (error) => h('.text-center', errorComponent(error)),
      Success: (templates) =>
        (templates.length === 0)
          ? h('.text-center', errorComponent('No public templates found on this revision.')) :
          h('.shadow-level1.pv1',
            templates.map((template) =>
              h('.flex-row', [
                h('a.w-90.menu-item.w-wrapped', {
                  className: workflow.form.template === template ? 'selected' : null,
                  onclick: () => {
                    workflow.form.setTemplate(template);
                    workflow.generateVariablesSpec(template);
                  }
                }, template),
                h('a.w-10.flex-row.items-center.justify-center.actionable-icon', {
                  href: `//${repository}/blob/${revision}/workflows/${template}.yaml`,
                  target: '_blank',
                  title: `Open workflow '${template}' definition`
                }, info())
              ])
            )
          )
    })
  ]);

/**
 * Create a panel with:
 * * a text area in case of failure
 * * a button which requests the creation of environment
 * @param {Object} model
 * @return {vnode}
 */
const actionsPanel = (model) =>
  h('.mv2', [
    model.environment.itemNew.match({
      NotAsked: () => null,
      Loading: () => null,
      Success: (message) => h('.success', message),
      Failure: (error) => h('.text-center', errorComponent(error)),
    }),
    btnSaveEnvConfiguration(model),
    ' ',
    btnCreateEnvironment(model),
  ]);

/**
 * Method to add a button for creation of environment
 * @param {Object} model
 * @return {vnode}
 */
const btnCreateEnvironment = (model) => h('button.btn.btn-primary', {
  class: model.environment.itemNew.isLoading() ? 'loading' : '',
  disabled: model.environment.itemNew.isLoading() || !model.workflow.form.isInputSelected(),
  onclick: () => model.workflow.createNewEnvironment(),
  title: 'Create environment based on selected workflow'
}, 'Create');

/**
 * Button which allows the user to save the configuration for a future use
 * @param {Object} model 
 * @returns {vnode}
 */
const btnSaveEnvConfiguration = (model) =>
  h('button.btn.btn-default', {
    class: model.environment.itemNew.isLoading() ? 'loading' : '',
    disabled: model.environment.itemNew.isLoading() || !model.workflow.form.isInputSelected(),
    onclick: () => {
      const name = prompt('Enter a name for saving the configuration:');
      if (name && name.trim() !== '') {
        model.workflow.saveEnvConfiguration(name)
      }
    },
    title: 'Save current configuration for future use'
  }, 'Save Configuration');
