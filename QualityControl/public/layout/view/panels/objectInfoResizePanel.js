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

import {h, iconResizeBoth, info} from '/js/src/index.js';

/**
 * Builds 2 actionable buttons which are to be placed on top of a JSROOT plot
 * Buttons shall appear on hover of the plot
 * @param {Model.js} model 
 * @param {Tab} tabObject 
 * @returns 
 */
export const objectInfoResizePanel = (model, tabObject) => {
  const name = tabObject.name;
  const isSelectedOpen = model.object.selectedOpen;
  const metadata = [
    'drawOptions', 'displayHints', 'objectType', 'partname', 'run_type', 'runNumber',
    'qc_detector_name', 'qc_task_name', 'qc_version',
  ];
  return h('.text-right.resize-element.resize-button.flex-row', {
    style: 'display: none; padding: .25rem .25rem 0rem .25rem;'
  }, [
    !model.isOnlineModeEnabled &&
    h('', {style: 'padding-bottom: 0;'},
      h('.dropdown.mh1', {class: isSelectedOpen ? 'dropdown-open' : ''}, [
        h('button.btn', {
          title: 'View details about histogram',
          onclick: () => model.object.toggleInfoArea(name)
        }, info()),
        h('.dropdown-menu', {style: `right:0.1em; width: 25em;left: auto;`}, [
          h('.m1.gray-darker.flex-row', [
            h('.w-30.text-left', {style: 'font-weight: bold;'}, 'Name'),
            h('.w-70.text-right', {style: 'word-break: break-all;'}, name),
          ]),
          h('.m1.gray-darker.flex-row', [
            h('.w-30.text-left', {style: 'font-weight: bold;'}, 'Last Modified'),
            h('.w-70.text-right', {style: 'word-break: break-all;'}, model.object.getLastModifiedByName(name))
          ]),
          model.services.object.objectsLoadedMap[name].isSuccess() &&
          Object.keys(model.services.object.objectsLoadedMap[name].payload)
            .filter((key) => metadata.includes(key))
            .map((key) => h('.m1.gray-darker.flex-row', [
              h('.w-30.text-left', {style: 'font-weight: bold;'}, key),
              h('.w-70.text-right', model.services.object.objectsLoadedMap[name].payload[key])
            ]),
            )
        ]),
      ])
    ),
    h('a.btn', {
      title: 'Open object plot in full screen',
      href: `?page=objectView&objectId=${tabObject.id}&layoutId=${model.router.params.layoutId}`,
      onclick: (e) => model.router.handleLinkEvent(e)
    }, iconResizeBoth())
  ]);
}