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

import sessionService from '/js/src/sessionService.js';
sessionService.loadAndHideParameters();

// Expose sessionService to interact with it the browser's console
window.sessionService = sessionService;

// Import COG Public Configuration
import { COG } from './config.js';
window.COG = COG;

// Import MVC
import { mount } from '/js/src/index.js';
import view from './view.js';
import Model from './Model.js';

// Start application
const model = new Model();
const debug = true; // shows when redraw is done
mount(document.body, view, model, debug);

// Expose model to interract with it the browser's console
window.model = model;
