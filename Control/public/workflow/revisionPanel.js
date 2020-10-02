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

import {h, iconActionRedo} from '/js/src/index.js';
import errorComponent from './../common/errorComponent.js';

/**
* Method to create the revision input-dropdown panel
* @param {RemoteData} workflow
* @param {RemoteData<Map<String, JSON>>} templatesMap
* @param {string} repository
* @return {vnode}
*/
export default (workflow, templatesMap, repository) =>
  !templatesMap[repository] ?
    errorComponent('No revisions found for this repository. Please contact an administrator') :
    revisionInputDropdown(workflow, templatesMap, repository);


/**
 * Method which creates a combo box (input + dropdown) of repositories
 * @param {Object} workflow
 * @param {RemoteData<Map<String, JSON>>} templatesMap
 * @param {string} repository
 * @return {vnode}
 */
const revisionInputDropdown = (workflow, templatesMap, repository) => h('.m2.text-left.w-100', [
  h('h5', 'Revision:'),
  h('', {style: 'display:flex; flex-direction: row;'}, [
    h('.dropdown', {
      style: 'flex-grow: 1;',
      class: workflow.revision.isSelectionOpen ? 'dropdown-open' : ''
    }, [
      revisionInputField(workflow),
      revisionDropdownArea(workflow, templatesMap, repository)
    ]),
    workflow.isInputCommitFormat() && buttonCommitFormat(workflow)
  ]),
]);

/**
 * Create an input field for revision input:
 * * string of branch from repository
 * * commit sha which enables commit button
 * @param {Object} workflow
 * @return {vnode}
 */
const revisionInputField = (workflow) => h('input.form-control', {
  type: 'text',
  style: 'z-index:100',
  value: workflow.revision.rawValue,
  oninput: (e) => workflow.updateInputSearch('revision', e.target.value),
  onblur: () => workflow.closeRevisionInputDropdown(),
  onkeyup: (e) => {
    if (e.keyCode === 27) { // code for escape
      workflow.closeRevisionInputDropdown();
    }
  },
  onclick: (e) => {
    workflow.setRevisionInputDropdownVisibility(true);
    workflow.updateInputSearch('revision', '');
    e.stopPropagation();
  }
});


/**
 * Create dropdown area based on user input on revision field
 * @param {Object} workflow
 * @param {RemoteData<Map<String, JSON>>} templatesMap
 * @param {string} repository
 * @return {vnode}
 */
const revisionDropdownArea = (workflow, templatesMap, repository) => h('.dropdown-menu.w-100.scroll-y',
  {style: 'max-height: 25em;'},
  Object.keys(templatesMap[repository])
    .filter((name) => name.match(workflow.revision.regex))
    .map((revision) =>
      h('a.menu-item', {
        class: revision === workflow.form.revision ? 'selected' : '',
        onmousedown: () => workflow.updateInputSelection('revision', revision),
      }, revision)
    )
);

/**
* Button to be displayed if revision input is a commit format
* @param {Object} workflow
* @return {vnode}
*/
const buttonCommitFormat = (workflow) => h('button.btn.mh2', {
  title: 'Retrieve workflow templates for this commit',
  onclick: () => workflow.requestCommitTemplates()
}, iconActionRedo()
);
