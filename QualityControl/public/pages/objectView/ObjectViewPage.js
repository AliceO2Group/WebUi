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

import { h, iconMagnifyingGlass } from '/js/src/index.js';
import { draw } from './../../common/object/draw.js';
import { header } from './components/header.js';
import { spinner } from './../../common/spinner.js';
import { errorDiv } from '../../common/errorDiv.js';
import { dateSelector } from '../../common/object/dateSelector.js';
import { qcObjectInfoPanel } from '../../common/object/objectInfoCard.js';

/**
 * Shows a page to view an object on the whole page
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export default (model) => {
  const { objectViewModel } = model;
  const { objectName, objectId } = model.router.params;

  let title = objectName;
  if (objectId) {
    if (objectViewModel.selected.isSuccess()) {
      const { path, layoutName } = objectViewModel.selected.payload;
      title = `${path} (from layout: ${layoutName})`;
    } else {
      title = objectId;
    }
  }
  return h('.absolute-fill.flex-column', [
    h('.shadow-level1', [
      header(model, title),
      objectViewModel.isFilterVisible() && filtersPanel(objectViewModel),
    ]),
    objectPlotAndInfo(objectViewModel),
  ]);
};

/**
 * Panel containing input boxes for user to filter the object selection by
 * @param {ObjectViewModel} objectViewModel - model of the current page
 * @returns {vnode} - virtual node element
 */
const filtersPanel = (objectViewModel) => {
  const { filter, updateFilterKeyValue } = objectViewModel;
  return h('.w-100.flex-row.p2.g2', [
    filterInput('RunNumber', 'runNumberFilter', 'number', '.w-20', filter, updateFilterKeyValue.bind(objectViewModel)),
    filterInput('RunType', 'runTypeFilter', 'text', '.w-20', filter, updateFilterKeyValue.bind(objectViewModel)),
    filterInput('PeriodName', 'periodNameFilter', 'text', '.w-20', filter, updateFilterKeyValue.bind(objectViewModel)),
    filterInput('PassName', 'passNameFilter', 'text', '.w-20', filter, updateFilterKeyValue.bind(objectViewModel)),
    h('button.btn.btn-primary.w-20', {
      onclick: () => objectViewModel.updateObjectSelection({}, undefined, undefined, objectViewModel.filter),
    }, ['Search ', iconMagnifyingGlass()]),
  ]);
};

/**
 * Builds a filter element that will allow the user to specify a parameter that should be applied when querying objects
 * @param {string} placeholder - value to be placed as holder for input
 * @param {string} key - string to be used as unique id
 * @param {string} type - type of the filter
 * @param {string} width - size of the filter
 * @param {string} value - value of the input text field
 * @param {function} callback - callback for oninput event
 * @returns {vnode} - virtual node element
 */
const filterInput = (placeholder, key, type = 'text', width = '.w-10', value, callback) =>
  h(`${width}`, [
    h('input.form-control', {
      type,
      placeholder,
      id: key,
      name: key,
      min: 0,
      value: value[placeholder],
      oninput: (e) => callback(placeholder, e.target.value),
    }),
  ]);

/**
 * Build an element which plots the object and displays metadata information
 * @param {ObjectViewModel} objectViewModel - model for object view page
 * @returns {vnode} - virtual node element
 */
const objectPlotAndInfo = (objectViewModel) =>
  objectViewModel.selected.match({
    NotAsked: () => null,
    Loading: () => spinner(10, 'Loading object...'),
    Failure: (error) => errorDiv(error),
    Success: (qcObject) => {
      const {
        id, validFrom, ignoreDefaults = false, drawOptions = [], displayHints = [], layoutDisplayOptions = [], versions,
      } = qcObject;
      const drawingOptions = ignoreDefaults ?
        layoutDisplayOptions
        : [...drawOptions, ...displayHints, ...layoutDisplayOptions];
      return h('.w-100.h-100.flex-column.scroll-off', [
        h('.flex-row.justify-center.h-10', h('.w-40.p2.f6', dateSelector(
          { validFrom, id },
          versions,
          objectViewModel.updateObjectSelection.bind(objectViewModel),
        ))),
        h('.w-100.flex-row.g2.m2', { style: 'height: 0;flex-grow:1' }, [
          h('.w-70', draw(qcObject, {}, drawingOptions)),
          h('.w-30.scroll-y', [
            h('h3.text-center', 'Object information'),
            qcObjectInfoPanel(qcObject, { gap: '.5em' }),
          ]),
        ]),
      ]);
    },
  });
