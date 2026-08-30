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

// Import Framework tools
import {mount, h, Observable, iconDashboard, iconGridTwoUp, iconGridThreeUp, iconGridFourUp, iconCog} from '/js/src/index.js';

// This is our model, each time it is modified, it calls notify() and view is updated thanks to controller mount().
class Model extends Observable {
  constructor() {
    super();
    this.form = {name: '', online: false};
    this.filter = '';
    this.list = [
    	{name: 'TCP', online: true},
    	{name: 'MUON', online: true},
    	{name: 'TOF', online: false},
    	{name: 'EMCAL', online: true},
    	{name: 'PHOS', online: false},
    ];
  }

  setName(name) {
    this.form.name = name;
    this.notify();
  }

  setStatus(online) {
    this.form.online = online;
    this.notify();
  }
  
  setFilter(filter) {
  	this.filter = filter;
    this.notify();
  }
  
  add() {
  	this.list.push(this.form);
    this.form = {name: '', online: false};
    this.notify();
  }
}

// View uses a vnode tree, CSS classes and some handlers to change model
const view = (model) => h('.flex-column absolute-fill', [
  header(model),
  h('.flex-grow flex-row', [
    h('.sidebar', [
      h('.sidebar-content relative', [
        sidebar(model)
      ])
    ]),
    h('.flex-grow.relative', [
      content(model)
    ])
  ]),
]);

const header = (model) => h('.bg-white flex-row p2 shadow-level2 level2', [
  h('.flex-grow text-left', [
  	h('button.btn', iconCog()), ' ',
    h('span.f4 gray', 'Demo App')
  ]),
  h('.w-50 text-center', [
    h('h4', 'Status')
  ]),
  h('.flex-grow text-right', [
  	h('input.form-control.form-inline', {placeholder: 'Search', oninput: (e) => model.setFilter(e.target.value)}), ' ',
  ]),
]);

const content = (model) => [
  h('.scroll-y.absolute-fill.bg-white', [
  	h('p.p2.measure', 'This is an example of frontend use of WebUi Framework. You can add some elements to the table below and filter with search input.'),
    
    h('.measure.m2.bg-gray-lighter.p3.br4.text-no-select', [
      h('.form-group', [
        h('label', {for: 'input-name'}, 'Name'),
        h('input.form-control', {id: 'input-name', oninput: (e) => model.setName(e.target.value), value: model.form.name}, 'Name'),
      ]),
      h('.form-check.mv2', [
        h('input.form-check-input', {id: 'input-status', onclick: (e) => model.setStatus(e.target.checked), checked: model.form.online, type: 'checkbox'}),
        h('label.form-check-label', {for: 'input-status'}, 'Status online'),
      ]),
      h('button.btn btn-primary', {onclick: () => model.add()}, 'Add new detector'),
    ]),
    
    h('div.m2', [
      h('table.table', [
        h('thead', [
          h('tr', [
            h('th', 'Name'),
            h('th', 'Online'),
          ]),
        ]),
        listFiltered(model).map(item => h('tr', [
          h('td', item.name),
          h('td', {className: item.online ? '' : 'danger'}, item.online ? 'ON' : 'OFF')
        ]))
      ])
    ]),

  ])
];

const listFiltered = (model) => model.list.filter(item => item.name.toLocaleLowerCase().includes(model.filter.toLocaleLowerCase()));

const sidebar = (model) => h('.absolute-fill scroll-y', [
  h('.menu-title', 'Dashboard'),
  h('a.menu-item', [
    iconDashboard(), ' Status'
  ]),

  h('.menu-title', 'Listing'),
  h('a.menu-item', [
    iconGridTwoUp(), ' Environments'
  ]),
  h('a.menu-item', [
    iconGridThreeUp(), ' Roles'
  ]),
  h('a.menu-item', [
    iconGridFourUp(),
    ' ',
    '...'
  ]),
]);

// Start application
const model = new Model();
const debug = true; // shows when redraw is done with timing, must always be < 33ms (30 FPS)
// Mount will listen to model changes and draw inside body the view
mount(document.body, view, model, debug);

// Expose model to interact with it the browser's console
window.model = model;
