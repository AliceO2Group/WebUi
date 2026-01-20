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

import { ServiceStatus } from '../../../common/library/enums/Status/serviceStatus.enum.js';
import { interceptRequest } from '../requestInterceptor.js';

/**
 * An interceptor services statuses of integrated services.
 * @param {import('puppeteer').HTTPRequest} request - The puppeteer request
 * @param {IntegratedServices} integratedService - The {@link IntegratedServices} to intercept
 * @param {ServiceStatus} serviceStatus - The {@link ServiceStatus} to apply for the integrated service
 * @param {object} extras - Optional extras object.
 * @returns {undefined}
 */
export const integratedServiceInterceptor = (
  request,
  integratedService,
  serviceStatus = ServiceStatus.SUCCESS,
  extras = {},
) => interceptRequest(request, new RegExp(`/api/status/${integratedService}`), async (req) => {
  await req.respond({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      name: integratedService,
      status: {
        ok: serviceStatus === ServiceStatus.SUCCESS,
        category: serviceStatus,
      },
      extras,
    }),
  });
});
