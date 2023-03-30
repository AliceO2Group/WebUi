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
 * Component which will display a modal allowing the users to select their detector view
 * No matter the page location, modal will be displayed if user did not make a selection
 * @param {Model} model - root model of the application
 * @return {vnode} - virtual node element
 */
export default (model) =>
  h('.o2-modal', [
    h('.o2-modal-content', [
      h('.p2.text-center.flex-column', [
        h('h4.pv1', 'Import a layout in JSON format'),
        h('', h('textarea.form-control.w-100', {
          rows: 15,
          placeholder: 'e.g.\n{\n\t"name": "my layout",\n\t"displayTimestamp": "false",' +
            '\n\t"displayTimestamp": "autoTabChange": "10", \n\t"tabs": "[]"\n}',
          oninput: (e) => model.layout.setImportValue(e.target.value),
          style: 'resize: vertical;',
        })),
        model.services.layout.new.match({
          NotAsked: () => null,
          Loading: () => h('', 'Loading...'),
          Success: (_) => null,
          Failure: (error) => h('.danger.pv1', error.message),
        }),
        h('.btn-group.w-100.align-center.pv1', {
          style: 'display:flex; justify-content:center;',
        }, [
          h('button.btn.btn-primary', {
            disabled: model.layout.newJSON === undefined || model.services.layout.new.isFailure(),
            onclick: () => model.layout.newFromJson(model.layout.newJSON),
          }, 'Import'),
          h('button.btn', {
            onclick: () => model.layout.resetImport(),
          }, 'Cancel'),
        ]),
      ]),
    ]),
  ]);
