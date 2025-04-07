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

import { ServiceStatus } from '../../../library/enums/Status/serviceStatus.enum.js';
import { servicesLoadingPanel } from './components/servicesLoadingPanel.js';
import { servicesResolvedPanel } from './components/servicesResolvedPanel.js';
import { h } from '/js/src/index.js';

/**
 * Shows a page to view framework information
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export default (model) => h(
  '.p2.absolute-fill.text-center',
  servicesLoadingPanel(model.aboutViewModel.services[ServiceStatus.LOADING]),
  servicesResolvedPanel(model.aboutViewModel.services[ServiceStatus.ERROR], 'error'),
  servicesResolvedPanel(model.aboutViewModel.services[ServiceStatus.SUCCESS], 'success'),
);
