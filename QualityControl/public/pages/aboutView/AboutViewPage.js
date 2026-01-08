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
 * @param {AboutViewModel} aboutViewModel - root model of the application
 * @returns {vnode} - virtual node element
 */
export default (aboutViewModel) => {
  const { services } = aboutViewModel;
  return [
    h(
      '.flex-column.flex-grow.p2.text-center',
      { key: 'about-view-page' },
      [
        servicesLoadingPanel(services[ServiceStatus.LOADING]),
        servicesResolvedPanel(services[ServiceStatus.ERROR], 'error'),
        servicesResolvedPanel(services[ServiceStatus.SUCCESS], 'success'),
      ],
    ),
  ];
};
