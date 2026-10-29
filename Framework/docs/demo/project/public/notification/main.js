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

import {mount, h, Notification, notification} from '/js/src/index.js';

const view = (model) => [
  notification(model),
  h('div.m4', [
    h('button', {onclick: () => model.show('An admin has taken lock form you.', 'primary')}, 'Show primary'),
    h('button', {onclick: () => model.show('Environment has been created.', 'success')}, 'Show success'),
    h('button', {onclick: () => model.show('Unable to create, please check inputs and retry.', 'warning')}, 'Show warning'),
    h('button', {onclick: () => model.show('Server connection has been lost.', 'danger')}, 'Show danger'),
  ]),
];

// Create some basic model
const model = new Notification();

mount(document.body, view, model, true);
window.model = model;
