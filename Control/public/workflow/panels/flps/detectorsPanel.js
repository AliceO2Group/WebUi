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
import {DetectorLockAction} from '../../../common/enums/DetectorLockAction.enum.js';
import { TST_DETECTOR_NAME } from '../../../common/detectorUtils.js';

/**
 * Create a selection area for all detectors retrieved from AliECS
 * @param {Object} model
 * @param {boolean} onlyGlobal - if it should display global detectors only
 * @return {vnode}
 */
export default (model, onlyGlobal = false) => {
  const {activeDetectors} = model.workflow.flpSelection;
  const detectors = model.lock.padlockState;
  let allowedDetectors = [];
  let hasTstDetector = false;

  const areDetectorsReady = activeDetectors.isSuccess() && detectors.isSuccess();
  if (areDetectorsReady) {
    allowedDetectors = JSON.parse(JSON.stringify(detectors.payload));
    hasTstDetector = Object.keys(allowedDetectors).includes(TST_DETECTOR_NAME);

    delete allowedDetectors.TST;
    allowedDetectors = Object.keys(allowedDetectors);
  }

  return h('.w-100.flex-column', [
    h('.flex-row.panel-title.p2.f6', {
      style: 'flex-wrap: wrap; gap: 0.5rem;'
    }, [
      areDetectorsReady && h('.flex-row.items-center', h('button.btn', {
        onclick: async () => {
          await model.lock.actionOnLock('ALL', DetectorLockAction.TAKE, false);
          if (onlyGlobal) {
            await model.lock.actionOnLock('TST', DetectorLockAction.RELEASE, false);
          }
        }
      }, 'Lock Available')),
      h('h5.flex-grow.items-center.flex-row.justify-center', {
        style: 'min-width: 60px;'
      }, 'Detectors Selection'),
      areDetectorsReady && h('.flex-row.items-center', h('button.btn.btn-primary', {
        onclick: async () => {
          model.workflow.flpSelection.selectAllAvailableDetectors(allowedDetectors);
        }
      }, 'Select Available'))
    ]),
    h('.p2.panel',
      (activeDetectors.isLoading() || detectors.isLoading()) && pageLoading(2),
      (!areDetectorsReady) && h('.f7.flex-column',
        `Loading detectors...active: ${activeDetectors.kind} and all: ${detectors.kind}`),
      (areDetectorsReady) && detectorsSelectionArea(model, allowedDetectors),
      (areDetectorsReady && !onlyGlobal) && [
        hasTstDetector && h('hr.m2'), // add visual separation between TST and other detectors
        hasTstDetector && detectorsSelectionArea(model, [TST_DETECTOR_NAME]),
      ],
      (activeDetectors.isFailure() || detectors.isFailure()) && h('.f7.flex-column', 'Unavailable to load detectors'),
    )
  ]);
};

/**
 * Display an area with selectable elements representing detectors
 * @param {Model} model - root model of the application
 * @param {Array<string>} detectors - list of detectors to allow selection of
 * @return {vnode}
 */
const detectorsSelectionArea = (model, detectors) => {
  return h('.w-100.m1.text-left.grid.g2', {
  }, [
    detectors
      .filter((name) => (name === model.detectors.selected || !model.detectors.isSingleView()))
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
  const {workflow, lock: lockModel, services: {detectors: {availability = {}} = {}}} = model;

  let className = '';
  let title = '';
  let style = 'font-weight: 150;flex-grow:2';
  const lockState = lockModel.padlockState.payload?.[name];
  const isDetectorActive = workflow.flpSelection.isDetectorActive(name);
  if (isDetectorActive
    || (lockModel.isLocked(name) && !lockModel.isLockedByCurrentUser(name))) {
    className = 'disabled-item warning';
    title = 'Detector is running and/or locked';
  } else if (lockModel.isLockedByCurrentUser(name)) {
    if (workflow.flpSelection.selectedDetectors.indexOf(name) >= 0) {
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
      detectorLockButton(lockModel, name, lockState, true, isDetectorActive),
      h('a.menu-item.w-wrapped', {
        className,
        id: `detectorSelectionButtonFor${name}`,
        title,
        style,
        onclick: () => {
          if (lockModel.isLockedByCurrentUser(name)) {
            workflow.flpSelection.toggleDetectorSelection(name);
          }
        }
      }, workflow.flpSelection.getDetectorWithIndexes(name)
      )
    ]),
    h('.f6.flex-row.g2', [
      isDetectorActive && h('.flex-row.g1', [h('.primary', iconPulse()), 'Active']),
      dcsPropertiesRow(availability[name]),
    ])
  ]);
};
