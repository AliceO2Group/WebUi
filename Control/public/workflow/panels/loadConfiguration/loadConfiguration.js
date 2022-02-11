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

import {h} from '/js/src/index.js';

/**
 * Build a panel allowing the user to select a stored configuration and load it within
 * the new environment page;
 * Configurations are loaded via Apricot and panel is displayed only if loading is successful
 * @param {Object} workflow
 * @return {vnode}
*/
export default (workflow) =>
  h('.flex-column', [
    h('.w-100', 'Load from existing configurations:'),
    h('.flex-row', [
      workflow.savedConfigurations.match({
        NotAsked: () => null,
        Loading: () => null,
        Failure: () => null,
        Success: (item) => [
          configurationSelection(workflow, item.payload),
          loadErrorPanel(workflow),
        ]
      }),
      h('.w-20.flex-end', btnSaveEnvConfiguration(workflow.model))
    ])
  ]);

/**
 * Create a configuration selection panel which is displayed only if the list of configurations
 * was provided by apricot successfully
 * @param {Workflow} workflow
 * @returns 
 */
const configurationSelection = (workflow, configurations) => {
  return h('.w-100.flex-column.ph1', [
    h('.flex-row', [
      h(`.w-100.dropdown${workflow.isLoadConfigurationVisible && '.dropdown-open'}`, [
        searchConfigurationField(workflow),
        configurationDropdownArea(workflow, configurations)
      ]),
      loadConfigurationButton(workflow)
    ]),
  ]);
};

/**
 * Create an input field which will be used by the user to search for a stored configuration
 * * Clicking on the input will make the dropdown area appear
 * * Clicking on an element from the dropdown area will update selection
 * * Clicking outside of the input box or pressing ESC will close the dropdown with no selection made
 * @param {Workflow} workflow
 * @returns {vnode}
 */
const searchConfigurationField = (workflow) =>
  h('input.form-control.w-100', {
    type: 'text',
    style: 'z-index:100',
    value: workflow.selectedConfigurationRaw,
    oninput: (e) => {
      workflow.selectedConfigurationRaw = e.target.value;
      workflow.notify();
    },
    onblur: () => {
      workflow.isLoadConfigurationVisible = false;
      workflow.selectedConfigurationRaw = workflow.selectedConfiguration;
      workflow.notify();
    },
    onkeyup: (e) => {
      if (e.keyCode === 27) { // code for escape
        workflow.isLoadConfigurationVisible = false;
        workflow.selectedConfigurationRaw = workflow.selectedConfiguration;
        workflow.notify();
      }
    },
    onclick: () => {
      workflow.isLoadConfigurationVisible = true;
      workflow.notify();
    }
  });

/**
 * Dropdown area displayed when the searchConfigurationField focused;
 * Contains a list of configurations;
 * @param {Workflow} workflow 
 * @returns 
 */
const configurationDropdownArea = (workflow, configurations) =>
  h('.dropdown-menu.w-100.scroll-y', {style: 'max-height: 25em;'},
    configurations
      .filter((name) => name.toLocaleLowerCase().match(
        new RegExp(`.*${workflow.selectedConfigurationRaw.toLocaleLowerCase()}.*`))
      ).map((name) =>
        h('a.menu-item.w-wrapped', {
          class: name === workflow.selectedConfiguration ? 'selected' : '',
          onmousedown: () => {
            workflow.selectedConfiguration = name;
            workflow.selectedConfigurationRaw = name;
            workflow.isLoadConfigurationVisible = false;
            workflow.notify();
          }
        }, name)
      )
  );

/**
 * Button to allow the user to load the selected configuration
 * @param {Workflow} workflow 
 * @returns {vnode}
 */
const loadConfigurationButton = (workflow) =>
  h('button.btn.btn-default.mh2', {
    class: workflow.loadingConfiguration.isLoading() ? 'loading' : '',
    disabled: workflow.loadingConfiguration.isLoading() || workflow.selectedConfiguration === '',
    onclick: () => workflow.getAndSetNamedConfiguration(workflow.selectedConfiguration)
  }, 'Load')

/**
 * Displays any potential errors from loading existing configuration
 * @param {Workflow} workflow 
 * @returns {vnode}
 */
const loadErrorPanel = (workflow) => {
  const isDetectorViewMatch = workflow.flpSelection.detectorViewConfigurationError;
  const areAllHostsAvailable = workflow.flpSelection.missingHosts.length === 0;
  if (isDetectorViewMatch) {
    return h('.w-100.flex-column.ph2', [
      h('.danger', 'Configuration cannot be loaded in this detector view'),
    ]);
  } else if (!areAllHostsAvailable) {
    return h('.w-100.flex-column.ph2', [
      h('.danger', 'The following saved hosts are not available anymore:'),
      h('.flex-row.danger', workflow.flpSelection.missingHosts.toString())
    ]);
  }
};

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
  }, 'Save As');
