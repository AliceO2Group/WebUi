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

import { serviceCard } from './serviceCard.js';
import { h } from '/js/src/index.js';

/**
 * Build a reusable panel to display a wrapped list of service panels with their respective information
 * @param {Map<object>} servicesMap - Map of services with their respective information
 * @param {string} category - Category of the services to be displayed
 * @returns {vnode} - A virtual node representing the resolved panel
 */
export const servicesResolvedPanel = (servicesMap, category) => {
  const services = Object.values(servicesMap);
  if (services.length > 0) {
    const label = `Services that are in ${category.toLocaleUpperCase()} state`;
    const classes = category === 'error' ? 'danger' : category ?? '';
    return h(
      '.w-100.flex-column.p2.shadow-level1',
      h('h4', { class: classes }, label),
      h('.flex-wrap.g1', [
        services
          .sort(({ payload: { name: nameA } }, { payload: { name: nameB } }) => nameA > nameB ? 1 : -1)
          .map(({ payload }) => serviceCard(payload)),
      ]),
    );
  }
  return null;
};
