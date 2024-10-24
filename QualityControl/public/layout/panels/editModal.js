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

import { h } from '/js/src/index.js';

/**
 * Displays a panel allowing users to edit the JSON file of the layout
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export default (model) => h('.o2-modal', [
  h('.o2-modal-content', [
    h('.p2.text-center.flex-column', [
      h('h4.pv1', 'Edit JSON file of a layout'),
      h('', h('textarea.form-control.w-100', {
        rows: 15,
        oninput: (e) => model.layout.checkLayoutToUpdate(e.target.value),
        style: 'resize: vertical;',
        id: 'layout-json-editor',
        value: model.layout.getUpdatedLayout(),
      })),
      model.services.layout.update.match({
        NotAsked: () => null,
        Loading: () => h('', 'Loading...'),
        Success: (_) => null,
        Failure: (error) => h('.danger.pv1', error),
      }),
      h('.btn-group.w-100.align-center.pv1', {
        style: 'display:flex; justify-content:center;',
      }, [
        h('button.btn.btn-primary', {
          disabled: model.services.layout.update.isFailure(),
          onclick: () => model.layout.updateLayout(),
        }, 'Update template'),
        h('button.btn', {
          onclick: () => {
            model.isUpdateVisible = false;
          },
        }, 'Cancel'),
      ]),
    ]),
  ]),
]);
;
