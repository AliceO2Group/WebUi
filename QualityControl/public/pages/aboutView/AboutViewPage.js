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

import { h } from '/js/src/index.js';
import { servicePanel } from './components/servicePanel.js';

/**
 * Shows a page to view framework information
 * @param {AboutViewModel} aboutViewModel - root model of the application
 * @returns {vnode} - virtual node element
 */
export default (aboutViewModel) =>
  h(
    '.flex-column.flex-grow.p2',
    { key: 'about-view-page' },
    Object.entries(aboutViewModel.services).map(([serviceStatus, service]) => servicePanel(serviceStatus, service)),
  );
