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

const sessionParams: string[] = [];

export const fetchSessionData = async () => {
  // only to get the data from server redirect
  // (line 264, commit 3ba4600 of github.com/AliceO2Group/WebUi/blob/dev/Framework/Backend/http/server.js)
  // this should be replaced with endpoint designed for authentication only
  const response = await fetch('http://localhost:8080/api/');
  const { searchParams } = new URL(response.url);
  searchParams.forEach((value, key) => {
    sessionStorage.setItem(key, value);
    sessionParams.push(key);
  });
};

export const getSessionData = (): Record<string, string> => {
  const output: Record<string, string> = {};
  sessionParams.forEach((sessionParam) => {
    const param = sessionStorage.getItem(sessionParam);
    if (param) {
      output[sessionParam] = param;
    }
  });
  return output;
};

export const deleteSessionData = () => {
  sessionStorage.clear();
  sessionParams.length = 0;
};
