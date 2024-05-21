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

/**
 * Given a date representation , return the timestamp as a number
 * @example 'Sun, 10 Jul 2022 07:15:06 GMT'  -> 1657437306000
 * @example '1657437306000' -> 1657437306000
 * @param {string | Date} dateAsString - string or number representation of a date
 * @return {number} Given date as a number or unparsed value if could not be parsed
 */
export const getDateAsTimestamp = (dateAsString) => {
  try {
    if (isNaN(dateAsString)) {
      const dateTime = new Date(dateAsString).getTime();
      return isNaN(dateTime)
        ? dateAsString
        : dateTime;
    } else {
      return Number(dateAsString);
    }
  } catch (error) {
    return dateAsString;
  }
};
