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
import { h, switchCase } from '/js/src/index.js';
import { ServiceStatus } from '../../../../library/enums/Status/serviceStatus.enum.js';

/**
 * Build a reusable panel to display a wrapped list of service panels with their respective information
 * @param {ServiceStatus} serviceStatus - Category of the service to be displayed
 * @param {RemoteData[]} serviceData - Information of services
 * @returns {vnode} - A virtual node representing the resolved panel
 */
export const servicesResolvedPanel = (serviceStatus, serviceData) => {
  const label = `Services that are in ${serviceStatus.toLocaleUpperCase()} state`;
  const classes = switchCase(serviceStatus, {
    [ServiceStatus.ERROR]: 'danger',
    [ServiceStatus.SUCCESS]: 'success',
    [ServiceStatus.NOT_ASKED]: 'gray-darker',
    [ServiceStatus.NOT_CONFIGURED]: 'gray-darker',
  }, '');

  return h('.w-100.flex-column.p2.shadow-level1', { id: `service-status-${serviceStatus.toLowerCase()}` }, [
    h('h4', { class: classes }, label),
    h('.flex-wrap.g1', [
      serviceData
        .sort(({ payload: { name: nameA } }, { payload: { name: nameB } }) => nameA > nameB ? 1 : -1)
        .map(({ payload }) => serviceCard(payload)),
    ]),
  ]);
};
