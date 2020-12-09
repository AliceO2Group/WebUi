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
import loadingAnimation from './../common/loadingAnimation.js';
import errorComponent from './../common/errorComponent.js';

/**
 * Component which will display information about the framework of InfoLogger
 * @param {Object} model
 * @return {vnode}
 */
export default (model) =>
  h('aside.sidebar', {style: {width: model.frameworkInfoEnabled ? '' : '0rem'}}, [
    h('.sidebar-content.scroll-y.p1.text-center', [
      model.frameworkInfo.match({
        NotAsked: () => null,
        Loading: () => h('.f1', loadingAnimation()),
        Success: (data) => showContent(data),
        Failure: (error) => errorComponent(error),
      })
    ])
  ]);

/**
* Display a table with information about infologger framework
* @param {Object} components
* @return {vnode}
*/
const showContent = (components) =>
  Object.keys(components).map((componentName) => [
    h('table.table.f7.shadow-level1', {style: 'white-space: pre-wrap'},
      h('tbody', [
        componentHeader(componentName, components[componentName].status),
        Object.keys(components[componentName]).map((name) => componentInfoRow(name, components[componentName]))
      ])
    )
  ]);

/**
 * Build the header of the component
 * @return {vnode}
 */
const componentHeader = (name, status) =>
  h('tr', [
    h('th',
      status && status.ok && h('.badge.bg-success.white.f6', '✓'),
      status && !status.ok && h('.badge.bg-danger.white.f6', '✕')
    ),
    h('th.w-100', {style: 'text-decoration: underline'}, name.charAt(0).toUpperCase() + name.slice(1)),
  ]);

/**
* Create a row with 2 columns: name and value
* containing information about a sub-property of the component
* @param {string} name - sub-property of component
* @param {string} componentProps
* @return {vnode}
*/
const componentInfoRow = (name, componentProps) =>
  name === 'status' ?
    !componentProps.status.ok &&
    h('tr.danger', [
      h('th.w-25', 'error'),
      h('td', componentProps.status.message),
    ])
    :
    h('tr', [
      h('th.w-25', name),
      h('td', JSON.stringify(componentProps[name])),
    ]);