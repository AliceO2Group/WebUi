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

import {h, info} from '/js/src/index.js';

/**
 * Method to create and display an info button on top of a histogram
 * which expects an object
 * @param {Object} object
 * @param {boolean} isOnlineModeEnabled
 * @return {vnode}
 */
export default (object, isOnlineModeEnabled) => object.selected && !isOnlineModeEnabled &&
  h('.p1.text-right', {style: 'padding-bottom: 0;'},
    h('.dropdown', {class: object.selectedOpen ? 'dropdown-open' : ''}, [
      h('button.btn',
        {
          title: 'View details about histogram',
          onclick: () => object.toggleInfoArea()
        }, info()
      ),
      h('.dropdown-menu', {style: 'right:0.1em; left: auto; white-space: nowrap;'}, [
        h('.m2.gray-darker.text-center', [
          h('.menu-title', {style: 'font-weight: bold; margin-bottom: 0'}, 'PATH'),
          object.selected.name
        ]),
        h('.m2.gray-darker.text-center', [
          h('.menu-title', {style: 'font-weight: bold; margin-bottom: 0'}, 'LAST MODIFIED'),
          object.selected.lastModified ?
            `${new Date(object.selected.lastModified).toLocaleString()}`
            :
            'Loading...'
        ]),

      ]),
    ])
  );
