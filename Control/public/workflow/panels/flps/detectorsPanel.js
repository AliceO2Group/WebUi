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
import pageLoading from './../../../common/pageLoading.js';

/**
 * Create a selection area for all detectors retrieved from AliECS
 * @param {Object} workflow
 * @return {vnode}
 */
export default (workflow) => {
  const activeDetectors = workflow.flpSelection.activeDetectors;
  const detectors = workflow.flpSelection.detectors;
  return h('.w-100', [
    h('.w-100.flex-row.panel-title.p2', h('h5.w-100.bg-gray-light', 'Detectors Selection')),
    h('.w-100.p2.panel',
      (activeDetectors.isLoading() || detectors.isLoading()) && pageLoading(2),
      (activeDetectors.isSuccess() && detectors.isSuccess()) && detectorsSelectionArea(detectors.payload, workflow),
      (activeDetectors.isFailure() || detectors.isFailure()) && h('.f7.flex-column', 'Unavailable to load detectors'),
    )
  ]);
};

/**
 * Display an area with selectable elements representing detectors
 * @param {Array<string>} list
 * @param {Object} workflow
 * @return {vnode}
 */
const detectorsSelectionArea = (list, workflow) => {
  return h('.w-100.m1.text-left.shadow-level1.scroll-y', {
    style: 'max-height: 25em;'
  }, [
    list.filter((name) => (name === workflow.model.detectors.selected || !workflow.model.detectors.isSingleView()))
      .map((name) => detectorItem(name, workflow))
  ]);
};

/**
 * Display an item per detector and build its properties
 */
const detectorItem = (name, workflow) => {
  let className = '';
  let title = '';
  if (workflow.flpSelection.selectedDetectors.indexOf(name) >= 0) {
    className += 'selected ';
  }
  if (workflow.flpSelection.unavailableDetectors.includes(name)) {
    className += 'bg-danger white';
    title = 'Detector from saved configuration is currently unavailable. Please deselect it';
  } else if (workflow.flpSelection.isDetectorActive(name)) {
    className += 'disabled-item ';
    title = 'Detector UNAVAILABLE';
  }
  return h('a.menu-item', {
    className,
    title,
    onclick: () => workflow.flpSelection.toggleDetectorSelection(name)
  }, name)
};
