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

const sessionData: Record<string, string> = {};

/**
 * Function for fetching session data from the Control server
 */
export async function fetchSessionData() {
  // only to get the data from server redirect
  // (line 264, commit 3ba4600 of github.com/AliceO2Group/WebUi/blob/dev/Framework/Backend/http/server.js)
  // this should be replaced with endpoint designed for authentication only
  const response = await fetch('http://localhost:8080/control');
  const { searchParams } = new URL(response.url);
  searchParams.forEach((value, key) => {
    sessionData[key] = value;
  });
}

/**
 * Function for reading session data fetched from the Control server
 * @returns {Record<string, string>} sessionData
 */
export function getSessionData(): Record<string, string> {
  return sessionData;
}

/**
 * Function for deleting session data fetched from the Control server
 * Intended to logout the user
 */
export function deleteSessionData() {
  for (const key in sessionData) {
    delete sessionData[key];
  }
};
