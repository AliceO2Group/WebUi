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
import {servicesResolvedPanel} from './components/panels/servicesResolvedPanel.js';
import {servicesInQueryPanel} from './components/panels/servicesInQueryPanel.js';

/**
 * @file Content for About Page
 */

/**
 * Content of the status page (or framework info)
 * Contains multiple panels with different statuses of the components used by the system
 * @param {Model} model
 * @returns {vnode}
 */
export const content = ({about}) => {
  const inError = about.getInErrorServices();
  const inLoading = about.getInLoadingComponents();
  const inSuccess = about.getInSuccessServices();
  const notEnabled = about.getNotEnabledServices();
  return h('.scroll-y.absolute-fill.flex-column.p2.g2',
    servicesInQueryPanel(inLoading),
    servicesResolvedPanel(inError, 'error'),
    servicesResolvedPanel(inSuccess, 'success'),
    servicesResolvedPanel(notEnabled),
  );
}
