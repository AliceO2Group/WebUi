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
import { servicesResolvedPanel } from './components/panels/servicesResolvedPanel.js';
import { servicesInLoadingPanel } from './components/panels/servicesInLoadingPanel.js';
import { SERVICE_STATES } from '../common/constants/serviceStates.js';
const { IN_ERROR, IN_LOADING, IN_SUCCESS, NOT_ENABLED } = SERVICE_STATES;

/**
 * @file Content for About Page
 */

/**
 * Content of the status page (or framework info)
 * Contains multiple panels with different statuses of the components used by the system
 * @param {Model} model
 * @returns {vnode}
 */
export const content = ({ about: { services } = {} }) => h(
  '.scroll-y.absolute-fill.flex-column.p2.g2',
  servicesInLoadingPanel(services[IN_LOADING]),
  servicesResolvedPanel(services[IN_ERROR], 'error'),
  servicesResolvedPanel(services[IN_SUCCESS], 'success'),
  servicesResolvedPanel(services[NOT_ENABLED]),
);
