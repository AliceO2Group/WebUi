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

import { h, iconChevronBottom, iconChevronTop } from '/js/src/index.js';

/**
 * Button to toggle the visibility of a detector panel if it contains tasks
 * Otherwise, it shows a label indicating no tasks are present
 * @param {{list: Map<string, object>, isOpened: boolean}} detectorPanel - the detector panel data and display configuration
 * @param {Function} callback - the callback function to notify changes when button is pressed
 */
export const toggleDetectorPanelVisibilityButton = (detectorPanel, callback) => {
  let doesDetectorHaveTasks = false;
  if (detectorPanel.list.isSuccess()) {
    doesDetectorHaveTasks = Object.keys(detectorPanel.list.payload)
      .some((host) => {
        const tasks = detectorPanel.list.payload[host];
        return tasks?.stdout && tasks?.list.length > 0;
      });
  }
  return !doesDetectorHaveTasks
    ? h('label', 'No tasks')
    : h('button.btn', {
      onclick: () => callback(!detectorPanel.isOpened)
    }, detectorPanel.isOpened ? iconChevronTop() : iconChevronBottom());
};
