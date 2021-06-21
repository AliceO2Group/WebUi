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
import errorComponent from './../../../common/errorComponent.js';

/**
* Method to create the revision input-dropdown panel
* @param {RemoteData} workflow
* @return {vnode}
*/
export default (workflow) =>
  h('.pv1.text-left.w-100', [
    h('h5', 'Revision:'),
    workflow.revisions.length === 0 ?
      h('', errorComponent('No revisions found for the selected repository')) :
      h('', {style: 'display:flex; flex-direction: row;'}, [
        h('.dropdown', {
          style: 'flex-grow: 1;',
          class: workflow.revision.isSelectionOpen ? 'dropdown-open' : ''
        }, [
          revisionInputField(workflow),
          revisionDropdownArea(workflow)
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
const revisionInputField = (workflow) =>
  h('input.form-control', {
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
 * @param {string} repository
 * @return {vnode}
 */
const revisionDropdownArea = (workflow) =>
  h('.dropdown-menu.w-100.scroll-y', {style: 'max-height: 25em;'},
    workflow.revisions
      .filter((name) => name.match(workflow.revision.regex))
      .map((revision) =>
        h('a.menu-item.w-wrapped', {
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
