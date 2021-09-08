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
import pageLoading from './../../../common/pageLoading.js';

/**
 * Create a selection area for all FLPs from consul
 * @param {Object} workflow
 * @return {vnode}
 */
export default (workflow) =>
  h('.w-100', [
    h('.w-100.flex-row.panel-title.p2', [
      h('.flex-column.justify-center.f6',
        h('button.btn', {
          class: workflow.flpSelection.areAllFLPsSelected() ? 'selected-btn' : 'none-selected-btn',
          onclick: () => workflow.flpSelection.toggleAllFLPSelection()
        }, 'Toggle')
      ),
      h('h5.bg-gray-light', {style: 'width: 90%'},
        workflow.flpSelection.list.kind === 'Success'
          ? `FLP Selection (${workflow.form.hosts.length} out of ${workflow.flpSelection.list.payload.length} selected)`
          : 'FLP Selection'
      ),
      h('.flex-column.dropdown#flp_selection_info_icon', {style: 'display: flex'}, [
        h('.ph1.actionable-icon.justify-center.flex-column', info()),
        h('.p2.dropdown-menu-right#flp_selection_info', {style: 'width: 350px'},
          `Keep SHIFT / ⇧ key pressed when selecting two machines to select all in-between machines.`)
      ])
    ]),
    h('.w-100.p2.panel',
      workflow.flpSelection.list.match({
        NotAsked: () =>  h('.f7.flex-column', 'Please select detector(s) first'),
        Loading: () => pageLoading(2),
        Success: (list) => flpSelectionArea(list, workflow),
        Failure: (error) => h('.f7.flex-column', [
          error.includes(404) ?
            h('', error)
            :
            h('', [
              h('', ' Please use `Advanced Configuration` panel to select your FLP Hosts')
            ])
        ]),
      })
    )
  ]);

/**
 * Display an area with selectable elements
 * @param {Array<string>} list
 * @param {Object} workflow
 * @return {vnode}
 */
const flpSelectionArea = (list, workflow) => {
  return h('.w-100.m1.text-left.shadow-level1.scroll-y', {
    style: 'max-height: 25em;'
  }, [
    list.map((name) => {
      const detector = workflow.flpSelection.getDetectorForHost(name);
      return h('a.menu-item', {
        className: workflow.form.hosts.indexOf(name) >= 0 ? 'selected' : null,
        onclick: (e) => workflow.flpSelection.toggleFLPSelection(name, e)
      }, [name, detector ? ` -- ${detector}` : ''])
    }
    ),
  ]);
};
