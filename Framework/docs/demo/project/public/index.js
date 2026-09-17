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

import { h, mount, Observable } from '/js/src/index.js';

const DEMOS = [
  { name: 'frontend',     label: 'Frontend' },
  { name: 'chart',        label: 'Chart' },
  { name: 'notification', label: 'Notification' },
  { name: 'template-1',   label: 'Template-1' },
  { name: 'template-2',   label: 'Template-2' },
];

class Model extends Observable {
    constructor() {
      super();
      this.demos = DEMOS;
    }
  }

function view (model) {
    return h('.absolute-fill.flex-column.items-center.justify-center',
      h('.bg-gray-lighter.br3.p4', [
        h('h1', 'WebUi Demos'),
        h('ul.list-unstyled',
          model.demos.map(d =>
            h('li.mb-2',
              h('a', {
                href: `/${d.name}${location.search}`,
                class: 'link-primary'
              }, d.label || d.name)
            )
          )
        ),
      ])
    );
}
  
// Start application
const model = new Model();
const debug = true;
mount(document.body, view, model, debug);
window.model = model;
