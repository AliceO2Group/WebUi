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

import { sessionService } from '/js/src/index.js';
sessionService.loadAndHideParameters();

// Expose sessionService to interact with it the browser's console
window.sessionService = sessionService;

// Import MVC
import { mount, StatefulComponent } from '/js/src/index.js';
import view from './view.js';
import Model from './Model.js';

// Start application
const model = new Model();
const debug = true; // shows when redraw is done
StatefulComponent.useRenderer(model); // Register the model for the stateful components
let currentView = view;
mount(document.body, (model) => currentView(model), model, debug);

// Expose model to interact with it the browser's console
window.model = model;

// Dev only: swap in the new view tree on edit and keep model state; stripped from the prod build
if (import.meta.hot) {
  import.meta.hot.accept('./view.js', (newModule) => {
    currentView = newModule.default;
    model.notify();
  });
}
