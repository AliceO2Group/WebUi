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

import {h, iconPulse} from '/js/src/index.js';
import pageLoading from './../../../common/pageLoading.js';
import {detectorLockButton} from './../../../lock/lockButton.js';
import {dcsPropertiesRow} from '../../../common/dcs/dcsPropertiesRow.js';

/**
 * Create a selection area for all detectors retrieved from AliECS
 * @param {Object} model
 * @param {boolean} onlyGlobal - if it should display global detectors only
 * @return {vnode}
 */
export default (model, onlyGlobal = false) => {
  const {activeDetectors} = model.workflow.flpSelection;
  const detectors = model.lock.padlockState;
  const areDetectorsReady = activeDetectors.isSuccess() && detectors.isSuccess();
  return h('.w-100', [
    h('.w-100.flex-row.panel-title.p2', h('h5.w-100.bg-gray-light', 'Detectors Selection')),
    h('.w-100.p2.panel',
      (activeDetectors.isLoading() || detectors.isLoading()) && pageLoading(2),
      (areDetectorsReady) && detectorsSelectionArea(model, Object.keys(detectors.payload), onlyGlobal),
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
  return h('.w-100.m1.text-left.shadow-level1.grid.g2', {
    style: 'max-height: 40em;'
  }, [
    list
      .filter((name) => (name === model.detectors.selected || !model.detectors.isSingleView()))
      .filter((name) => !onlyGlobal || (onlyGlobal && name !== 'TST'))
      .map((name) => detectorSelectionPanel(model, name))
  ]);
};

/**
 * Display a panel with information and current state of a detector
 * @param {Model} model - root model of the application
 * @param {String} name - name of the detector to display
 * @return {vnode}
 */
const detectorSelectionPanel = (model, name) => {
  let className = '';
  let title = '';
  let style = 'font-weight: 150;flex-grow:2';
  const {lock, services: {detectors: {availability = {}} = {}}} = model;
  const lockState = lock.padlockState.payload?.[name]
  const isDetectorActive = model.workflow.flpSelection.isDetectorActive(name);
  if (isDetectorActive
    || (model.lock.isLocked(name) && !model.lock.isLockedByCurrentUser(name))) {
    className = 'disabled-item warning';
    title = 'Detector is running and/or locked';
  } else if (model.lock.isLockedByCurrentUser(name)) {
    if (model.workflow.flpSelection.selectedDetectors.indexOf(name) >= 0) {
      className += 'selected ';
      title = 'Detector is locked and selected';
    }
  } else {
    className += 'disabled-item ';
    title = 'Detector is not locked';
  }

  return h('.flex-column.justify-center.items-center.shadow-level2', {
    id: `detector-selection-panel-${name}'`,
  }, [
    h('.flex-row', [
      detectorLockButton(model, name, lockState, true),
      h('a.menu-item.w-wrapped', {
        className,
        title,
        style,
        onclick: () => {
          if (model.lock.isLockedByCurrentUser(name)) {
            model.workflow.flpSelection.toggleDetectorSelection(name);
          }
        }
      }, model.workflow.flpSelection.getDetectorWithIndexes(name)
      )
    ]),
    h('.f6.flex-row.g2', [
      isDetectorActive && h('.flex-row.g1', [h('.primary', iconPulse()), 'Active']),
      dcsPropertiesRow(availability[name]),
    ])
  ]);
};
