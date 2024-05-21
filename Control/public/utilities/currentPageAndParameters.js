/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

/**
 * Returns the current url parameters as an object
 * @source {AliceO2/Bookkeeping}
 * @return {Object} the current URL parameters
 */
export const currentPageAndParameters = () => {
  const parameters = Object.fromEntries(new URLSearchParams(window.location.search).entries());
  const { page } = parameters;
  delete parameters.page;
  return { page, parameters };
};
