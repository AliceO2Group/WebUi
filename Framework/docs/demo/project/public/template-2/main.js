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

import {mount, h, Observable} from '/js/src/index.js';

// This is our model, each time it is modified, it calls notify() and view is updated thanks to controller mount().
class Model extends Observable {
  constructor() {
    super();
    this.count = 0;
  }

  increment() {
    this.count++;
    this.notify();
  }

  decrement() {
    this.count--;
    this.notify();
  }
}

// View uses a vnode tree, CSS classes and some handlers to change model
function view(model) {
  return h('.absolute-fill.flex-column.items-center.justify-center',
    h('.bg-gray-lighter.br3.p4', [
      h('h1', 'Hello World'),
      h('ul', [
      	// Template string is used to concatenate wording and values of the model
        h('li', `Counter: ${model.count}`),
      ]),
      h('div', [
        // Lambda functions are used to bind to click events and ask model to change current state
        h('button.btn', {onclick: e => model.increment()}, '++'), ' ',
        h('button.btn', {onclick: e => model.decrement()}, '--'), ' ',
      ])
    ])
  );
}

// Start application
const model = new Model();
const debug = true; // shows when redraw is done with timing, must always be < 33ms (30 FPS)
// Mount will listen to model changes and draw inside body the view
mount(document.body, view, model, debug);

// Expose model to interact with it the browser's console
window.model = model;
