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

// Import QCG Public Configuration
import { mount, sessionService } from '/js/src/index.js';
import view from './view.js';
import Model from './Model.js';

const { host } = window.location;
const envMap = {
  'localhost:8090': 'dev',
  'localhost:8081': 'test',
};

sessionService.loadAndHideParameters();

// Start application
const model = new Model();
const debug = true; // Shows when redraw is done
mount(document.body, view, model, debug);

if (envMap[host] === 'dev') {
  window.sessionService = sessionService;
  window.model = model;
}
