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

import { ServiceStatus } from '../../../../library/enums/Status/serviceStatus.enum.js';
import { servicesLoadingPanel } from './servicesLoadingPanel.js';
import { servicesResolvedPanel } from './servicesResolvedPanel.js';

/**
 * Build a reusable panel to display a wrapped list of service panels with their respective information
 * @param {ServiceStatus} serviceStatus - Map of services with their respective information
 * @param {Record<string, RemoteData>} servicesRecord - Category of the services to be displayed
 * @returns {vnode|null} - A virtual node representing the resolved panel
 */
export const servicePanel = (serviceStatus, servicesRecord) => {
  const serviceData = Object.values(servicesRecord);
  if (!serviceData.length) {
    return null;
  }

  return serviceStatus === ServiceStatus.LOADING
    ? servicesLoadingPanel(Object.keys(serviceStatus))
    : servicesResolvedPanel(serviceStatus, serviceData);
};
