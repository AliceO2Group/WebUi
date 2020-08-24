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

import {h} from '/js/src/index.js';

// The view
export default function view(model) {
  return h('.absolute-fill.flex-column.items-center.justify-center',
    h('.bg-gray-lighter.br3.p4', [
      h('h1', 'Hello World'),
      h('ul', [
        h('li', `local counter: ${model.count}`),
        h('li', `remote date: ${model.date}`),
      ]),
      h('div', [
        h('button.btn', {onclick: e => model.increment()}, '++'), ' ',
        h('button.btn', {onclick: e => model.decrement()}, '--'), ' ',
        h('button.btn', {onclick: e => model.fetchDate()}, 'Get date from server'), ' ',
        h('button.btn', {onclick: e => model.streamDate()}, 'Stream date from server'), ' ',
      ])
    ])
  );
}
