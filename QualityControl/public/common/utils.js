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
 * Generates a new ObjectId
 * @returns {string} 16 random chars, base 16
 */
export function objectId() {
  const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase();
}

/**
 * Make a deep clone of object provided
 * @param {object} obj - to be cloned
 * @returns {object} a deep copy
 */
export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Produces a lambda function waiting `time` ms before calling fn.
 * No matter how many calls are done to lambda, the last call is the waiting starting point.
 * @param {Function} fn - function to be called after `time` ms
 * @param {number} time - ms
 * @returns {Function} the lambda function produced
 */
export function timerDebouncer(fn, time) {
  let timer = {};
  return function (...args) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args); // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters
    }, time);
  };
}

const pointers = new WeakMap();
let currentAddress = 0;

/**
 * Generates a unique number for the provided object like a pointer or id
 * Two calls with the same object will provide the same number.
 * Uses a WeekMap so no memory leak.
 * @param {object} obj - the object that needs to be identified
 * @returns {number} a unique pointer number
 */
export function pointerId(obj) {
  let ptr = pointers.get(obj);
  if (!ptr) {
    ptr = currentAddress++;
    pointers.set(obj, ptr);
  }
  return ptr;
}

/**
 * Given a string-date or number-timestamp (ms), return it in a format approved by ALICE for QC
 * e.g. 7 Mar 2022, 19:08 CET / 18:08 UTC
 * If the passed parameter is not a date-valid format, a string 'Invalid Date' will be returned
 * @param {string|number} date - value of date to be parsed
 * @returns {string} - string representation of the 2 date values combined
 */
export function prettyFormatDate(date) {
  try {
    if (date) {
      return `${new Date(date).toLocaleString('en-GB', {
        timeZoneName: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })} / ${new Date(date).toLocaleString('en-GB', {
        timeZone: 'UTC',
        timeZoneName: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else {
      return '-';
    }
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Given a string, it will attempt to update the tab title if the `document` object exists
 * @param {string} title - name that should be updating the browser tab
 * @returns {void}
 */
export function setBrowserTabTitle(title = undefined) {
  if (document && title) {
    document.title = title;
  }
}
