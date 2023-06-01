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
 * Limit the number of calls to `fn` to 1 per `time` maximum.
 * First call is immediate if `time` have been waited already.
 * All other calls before end of `time` window will lead to 1 exececution at the end of window.
 * @param {string} fn - function to be called
 * @param {string} time - ms
 * @return {function} lambda function to be called to call `fn`
 * @example
 * let f = callRateLimiter((arg) => console.log('called', arg), 1000);
 * 00:00:00 f(1);f(2);f(3);f(4);
 * 00:00:00 called 1
 * 00:00:01 called 4
 */
export function callRateLimiter(fn, time) {
  let timer;
  let lastCall;
  return (...args) => {
    // first call or last call was far in the past: let's exec
    if (!lastCall || (Date.now() - lastCall) > time) {
      lastCall = Date.now();
      fn.call(null, ...args);
      return;
    }

    // exec already planed, replace it with new arguments
    if (timer) {
      clearTimeout(timer);
    }

    // plan an exec for near future
    timer = setTimeout(function() {
      lastCall = Date.now();
      fn.call(null, ...args);
      timer = null;
    }, time - (Date.now() - lastCall));
  };
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

