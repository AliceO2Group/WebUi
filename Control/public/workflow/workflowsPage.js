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

import { h, iconReload, info } from '/js/src/index.js';

import revisionPanel from './panels/revision/revisionPanel.js';
import { basicPanel } from './panels/variables/basicPanel.js';
import mainPanel from './panels/variables/mainPanel.js';
import advancedVarsPanel from './panels/variables/advancedPanel.js';
import flpSelectionPanel from './panels/flps/flpSelectionPanel.js';
import detectorsPanel from './panels/flps/detectorsPanel.js';

import { detectorHeader } from './../common/detectorHeader.js';
import errorComponent from './../common/errorComponent.js';
import pageLoading from './../common/pageLoading.js';
import errorPage from './../common/errorPage.js';
import { DetectorState } from './../common/enums/DetectorState.enum.js';
import { deployEnvironmentButton } from './../common/deployEnvironmentButton.component.js';

import { ROLES } from './../workflow/constants.js';
import { isUserAllowedRole } from './../common/userRole.js';

/**
 * @file Page to show a form for creating a new environment
 * from existing templates
 */

/**
 * Header of page showing form for creating a new environment
 * @param {object} model
 * @returns {vnode}
 */
export const header = (model) => h('h4.w-100 text-center', 'New Environment');

/**
 * Form with inputs for creating a new environment
 * Check that a lits of repositories was retrieved successfully
 * @param {object} model
 * @returns {vnode}
 */
export const content = (model) =>
  !isUserAllowedRole(ROLES.Detector) ?
    h('h3.m4.warning.text-center', ['You are not allowed to create environments.']) : h('', [
      detectorHeader(model),
      h('.scroll-y.absolute-fill.text-center.p2', { style: 'top:40px;' }, model.workflow.repoList.match({
        NotAsked: () => null,
        Loading: () => pageLoading(),
        Success: (repoList) => repoList.repos.length === 0
          ? h('h3.m4', ['No repositories found.']) : showNewEnvironmentForm(model, repoList.repos),
        Failure: (error) => errorPage(error),
      })),
    ]);

/**
 * Create a form for the user to select inputs for a new environment
 * @param {object} model
 * @param {Array<JSON>} repoList
 * @returns {vnode}
 */
const showNewEnvironmentForm = (model, repoList) => [
  h('.flex-column', [
    h('.flex-row.w-100', { style: 'flex-wrap: wrap' }, [
      h('.template-selection.flex-column', [
        h('h5.bg-gray-light.p2.panel-title.w-100', 'Select Template'),
        h('.form-group.p2.panel.w-100.flex-column', [
          repositoryDropdownList(model.workflow, repoList),
          revisionPanel(model.workflow),
          model.workflow.revisions.length !== 0 &&
          templateAreaList(model.workflow, model.workflow.form.repository, model.workflow.form.revision),
        ]),
        !model.workflow.isQcWorkflow && detectorsPanel(model),
      ]),
      !model.workflow.isQcWorkflow && h('.template-selection-large', flpSelectionPanel(model.workflow)),
    ]),
    model.workflow.form.template && workflowSettingsPanels(model.workflow),
  ]),
  actionsPanel(model),
];

/**
 * Creates multiple panels with the purpose of configuring
 * the to be created environment
 * @param {object} workflow
 * @returns {vnode}
 */
const workflowSettingsPanels = (workflow) => [
  Object.keys(workflow.selectedVarsMap).length > 0 ? h('.w-100.pv2.flex-row', mainPanel(workflow))
    : h('.w-100.flex-row', [
      basicPanel(workflow),
      advancedVarsPanel(workflow),
    ]),
];

/**
 * Method which creates a dropdown of repositories
 * @param {object} workflow
 * @param {Array<JSON>} repoList
 * @returns {vnode}
 */
const repositoryDropdownList = (workflow, repoList) =>
  h('.text-left.w-100', [
    h('h5', 'Repository:'),
    h('.flex-row.g1', [
      h('select.form-control', {
        style: 'cursor: pointer;',
        onchange: (e) => workflow.setRepository(e.target.value),
      }, [
        repoList.map((repository) => repository.name)
          .map((repository) => h('option', {
            selected: repository === workflow.form.repository ? true : false,
            value: repository,
          }, repository)),
      ]),
      refreshWorkflowsButton(workflow),
    ]),
  ]);

/**
 * Button which will send a request to AliECS to refresh existing ControlWorkflows repositories and their contents
 * @param {Workflow.js} workflow
 * @returns {vnode}
 */
const refreshWorkflowsButton = (workflow) => h('.flex-column.dropdown#flp_selection_info_icon', [
  h('button.btn', {
    title: 'Update Workflow Templates',
    class: workflow.refreshedRepositories.isLoading() ? 'loading' : '',
    disabled: workflow.refreshedRepositories.isLoading(),
    onclick: () => workflow.refreshRepositories(),
  }, iconReload()),
  h('.p2.dropdown-menu-right#flp_selection_info.text-center', { style: 'width: 350px' }, 'Request AliECS to update workflow templates.'),
]);

/**
 * Create the template Area List treating the edge cases:
 * * loading
 * * error
 * * empty list of templates
 * * templates as expected
 * @param {object} workflow
 * @param {string} repository
 * @param {string} revision
 * @returns {vnode}
 */
const templateAreaList = (workflow, repository, revision) =>
  h('.text-left.w-100', [
    h('h5', 'Workflow:'),
    workflow.templates.match({
      NotAsked: () => null,
      Loading: () => h('.w-100.text-center', pageLoading(2)),
      Failure: (error) => h('.text-center', errorComponent(error)),
      Success: (templates) =>
        templates.length === 0
          ? h('.text-center', errorComponent('No public templates found on this revision.')) :
          h(
            '.shadow-level1.pv1',
            templates.map((template) => {
              const { name } = template;
              const { description } = template;
              const isMirror = !repository.startsWith('github');
              return h('.flex-row', [
                h('a.w-90.menu-item.w-wrapped', {
                  className: workflow.form.template === name ? 'selected' : null,
                  onclick: () => {
                    workflow.form.setTemplate(name);
                    workflow.generateVariablesSpec(name);
                  },
                }, name),
                h('.w-10.dropdown#flp_selection_info_icon.items-center.justify-center', {
                  style: 'display: flex',
                }, [
                  !isMirror ? h('a', {
                    href: `//${repository}/blob/${revision}/workflows/${name}.yaml`,
                    target: '_blank',
                    title: `Open workflow '${name}' definition`,
                  }, info()) : description && h('', info()),
                  description && h('.p2.dropdown-menu-right#flp_selection_info.text-center', { style: 'width: 350px' }, description),
                ]),
              ]);
            }),
          ),
    }),
  ]);

/**
 * Create a panel at the bottom of the page that is to allow user to deploy an environment
 * if criteria is met.
 * To contain:
 * * a text output in case of failure with the error message
 * * a text output that informs the user on why create button is disabled (such as PFR not available on DCS selection)
 * * a button which triggers the creation of environment and redirects the user to active envs page is successful
 * @param {object} model - global model of the application
 * @returns {vnode}
 */
const actionsPanel = (model) => {
  const { workflow: workflowModel } = model;
  const { form: formModel, flpSelection } = workflowModel;
  const { services: { detectors } } = model;

  let isPfrAvailable = true;

  if (formModel.basicVariables?.dcs_enabled === 'true') {
    const detectorsSelected = flpSelection.selectedDetectors;
    isPfrAvailable = detectorsSelected.every((detectorName) =>
      detectors.availability[detectorName].pfrAvailability === DetectorState.PFR_AVAILABLE
        || detectors.availability[detectorName].pfrAvailability === DetectorState.UNDEFINED);
  }
  const isReady = model.workflow.form.isInputSelected()
    && (model.workflow.flpSelection.selectedDetectors.length > 0 || model.workflow.isQcWorkflow);

  return h('.mv2', [
    model.environment.itemNew.match({
      NotAsked: () => null,
      Loading: () => null,
      Success: () => null, // on success user is redirected to active envs page.
      Failure: (error) => h('.text-center', errorComponent(error)),
    }),
    !isPfrAvailable && h('.danger', 'PFR is not available for one or more of the selected detectors.'),
    deployEnvironmentButton(
      model.environment.itemNew.isLoading(),
      isReady,
      workflowModel.createNewEnvironment.bind(workflowModel),
    ),
  ]);
};
