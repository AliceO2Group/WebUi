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
import {detectorLockButton} from './../../../lock/lockButton.js';

/**
 * Create a selection area for all detectors retrieved from AliECS
 * @param {Object} model
 * @param {boolean} onlyGlobal - if it should display global detectors only
 * @return {vnode}
 */
export default (model, onlyGlobal = false) => {
  const {detectors, activeDetectors} = model.workflow.flpSelection;
  const areDetectorsReady = activeDetectors.isSuccess() && detectors.isSuccess();
  return h('.w-100', [
    h('.w-100.flex-row.panel-title.p2', h('h5.w-100.bg-gray-light', 'Detectors Selection')),
    h('.w-100.p2.panel',
      (activeDetectors.isLoading() || detectors.isLoading()) && pageLoading(2),
      (areDetectorsReady) && detectorsSelectionArea(model, detectors.payload, onlyGlobal),
      (activeDetectors.isFailure() || detectors.isFailure()) && h('.f7.flex-column', 'Unavailable to load detectors'),
    )
  ]);
};

/**
 * Display an area with selectable elements representing detectors
 * @param {Object} model
 * @param {Array<string>} list
 * @param {boolean} onlyGlobal - if only global detectors should be displayed
 * @return {vnode}
 */
const detectorsSelectionArea = (model, list, onlyGlobal) => {
  return h('.w-100.m1.text-left.shadow-level1.grid', {
    style: 'max-height: 40em;'
  }, [
    list
      .filter((name) => (name === model.detectors.selected || !model.detectors.isSingleView()))
      .filter((name) => !onlyGlobal || (onlyGlobal && name !== 'TST'))
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
    className = 'disabled-item warning';
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
    detectorLockButton(model, name, 'small'),
    h('a.w-90.menu-item.w-wrapped', {
      className,
      title,
      style,
      onclick: () => model.lock.isLockedByMe(name) && model.workflow.flpSelection.toggleDetectorSelection(name),
    }, model.workflow.flpSelection.getDetectorWithIndexes(name)),
  ]);
};
