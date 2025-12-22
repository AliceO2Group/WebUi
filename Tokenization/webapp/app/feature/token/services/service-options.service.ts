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

import type { Service } from "~/feature/service/types/service";

/**
 * Fetch available services from the backend, optionally filtered by a search term.
 */
export async function fetchAvailableServices(searchTerm = '', token?: string | null): Promise<Service[]> {

  const params = new URLSearchParams();

  if(searchTerm !== '') {
    params.append('searchTerm', searchTerm);
  }
  if (token) {
    params.append('token', token);
  }

  const queryString = params.toString();
  const url = queryString ? `/api/services?${queryString}` : '/api/services';
  const response = await fetch(url);

  const services: Service[] = await response.json();

  return services;
}
