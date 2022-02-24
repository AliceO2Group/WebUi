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
import {detectorButton as lockButton} from './../../../lock/lockButton.js';

/**
 * Create a selection area for all detectors retrieved from AliECS
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => {
  const activeDetectors = model.workflow.flpSelection.activeDetectors;
  const detectors = model.workflow.flpSelection.detectors;
  return h('.w-100', [
    h('.w-100.flex-row.panel-title.p2', h('h5.w-100.bg-gray-light', 'Detectors Selection')),
    h('.w-100.p2.panel',
      (activeDetectors.isLoading() || detectors.isLoading()) && pageLoading(2),
      (activeDetectors.isSuccess() && detectors.isSuccess()) && detectorsSelectionArea(model, detectors.payload),
      (activeDetectors.isFailure() || detectors.isFailure()) && h('.f7.flex-column', 'Unavailable to load detectors'),
    )
  ]);
};

/**
 * Display an area with selectable elements representing detectors
 * @param {Array<string>} list
 * @param {Object} model
 * @return {vnode}
 */
const detectorsSelectionArea = (model, list) => {
  return h('.w-100.m1.text-left.shadow-level1.scroll-y', {
    style: 'max-height: 25em;'
  }, [
    list.filter(
      (name) => (name === model.workflow.model.detectors.selected || !model.workflow.model.detectors.isSingleView()))
      .map((name) => detectorItem(model, name))
  ]);
};

/**
 * Display an item per detector and build its properties
 */
const detectorItem = (model, name) => {
  let className = '';
  let title = '';
  let style = 'font-weight: 150;';

  if (model.workflow.flpSelection.isDetectorActive(name)
    || (model.lock.isLocked(name) && !model.lock.isLockedByMe(name))) {
    className = 'disabled-item danger';
    title = 'Detector is running and/or locked';
  } else if (model.lock.isLockedByMe(name)) {
    if (model.workflow.flpSelection.selectedDetectors.indexOf(name) >= 0) {
      className += 'selected ';
      title = 'Detector is locked and selected';
    }
  } else {
    className += 'disabled-item ';
    title = 'Detector is not locked';
  }

  return h('.flex-row', [
    h('a.w-85.menu-item.w-wrapped', {
      className,
      title,
      style,
      onclick: () => model.lock.isLockedByMe(name) && model.workflow.flpSelection.toggleDetectorSelection(name),
    }, model.workflow.flpSelection.getDetectorWithIndexes(name)),
    lockButton(model, name)
  ]);
};
