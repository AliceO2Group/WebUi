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

import {mount, h, Observable, chartTimeSeries} from '/js/src/index.js';

// Example of chart integration with template engine
const view = (model) => [
  h('div.m4', [
    chartTimeSeries({
      series: model.series1,
      title: 'Sinus',
      colorPrimary: 'red',
      width: '800',
    }),
  ]),
  h('div.m4', [
    chartTimeSeries({
      series: model.series1,
      title: 'Sinus',
      colorPrimary: 'red',
      width: '800',
      timeWindow: 100,
    }),
  ]),
  h('div.m4', [
    chartTimeSeries({
      series: model.series2,
      title: 'Random',
      colorPrimary: 'blue',
      width: '800',
    }),
  ]),
  h('div.m4', [
    chartTimeSeries({
      series: model.series3,
      title: 'Sinus rounded',
      colorPrimary: 'green',
      width: '800',
    }),
  ]),
];

// Create some basic model
const model = new Observable();
model.series1 = [];
model.series2 = [];
model.series3 = [];
model.notify();

// Add points at 30 FPS but keep only first 800 points for memory leak
let i = 0;
setInterval(() => {
  i++;
  model.series1.push({value: Math.cos(i / 10), timestamp: Date.now()});
  model.series2.push({value: Math.random() * 10, timestamp: Date.now()});
  model.series3.push({value: Math.round(Math.cos(i / 10)), timestamp: Date.now()});

  model.series1.splice(0, model.series1.length - 800);
  model.series2.splice(0, model.series2.length - 800);
  model.series3.splice(0, model.series3.length - 800);

  model.notify();
}, 33);

mount(document.body, view, model, true);

window.model = model;
