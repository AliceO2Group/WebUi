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

import { isUserRoleSufficient } from '../../../../library/userRole.enum.js';
import { generateDrawingOptionString } from '../../library/qcObject/utils.js';
import { SUPPORTED_ROOT_IMAGE_FILE_TYPES } from './enums/rootImageMimes.enum.js';

/* global JSROOT */

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

// Map storing timers per key
const simpleDebouncerTimers = new Map();

/**
 * Produces a debounced function that uses a key to manage timers.
 * Each key has its own debounce timer, so calls with different keys
 * are debounced independently.
 * @template PrimitiveKey extends unknown
 * @param {PrimitiveKey} key - The key for this call.
 * @param {(key: PrimitiveKey) => void} fn - Function to debounce.
 * @param {number} time - Debounce delay in milliseconds.
 * @returns {undefined}
 */
export function simpleDebouncerData(key, fn, time) {
  if (simpleDebouncerTimers.has(key)) {
    clearTimeout(simpleDebouncerTimers.get(key));
  }

  const timerId = setTimeout(() => {
    fn(key);
    simpleDebouncerTimers.delete(key);
  }, time);

  simpleDebouncerTimers.set(key, timerId);
}

/**
 * Produces a lambda function waiting `time` ms before calling fn.
 * No matter how many calls are done to lambda, the last call is the waiting starting point.
 * @template K, A extends unknown[]
 * @param {(...args: A) => WeakKey} keyFn - Function that returns the key to debounce by.
 * @param {(...args: A) => void} debounceFn - Function executed after the debounce delay.
 * @param {number} time - Debounce delay in milliseconds.
 * @param {(...args: A) => void} [onFirstCall = () => {}] - Optional callback fired once when a new key is added.
 * @returns {(...args: A) => void} - Debounced function that can be called multiple times.
 */
export function keyedTimerDebouncer(
  keyFn,
  debounceFn,
  time,
  onFirstCall = () => {},
) {
  const timers = new WeakMap();

  return function (...args) {
    const key = keyFn(...args);

    if (timers.has(key)) {
      clearTimeout(timers.get(key));
    } else {
      onFirstCall(...args);
    }

    const timerId = setTimeout(() => {
      debounceFn(...args);// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters
      timers.delete(key);
    }, time);

    timers.set(key, timerId);
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

/**
 * Checks if any role in the provided list meets or exceeds the required permission level
 * @param {Array<UserRole>} userRoles - List of roles assigned to the user
 * @param {UserRole} requiredRole - Minimum role level needed for authorization
 * @returns {boolean} True if at least one user role meets or exceeds the required role level
 */
export function hasMinimumRoleAccess(userRoles, requiredRole) {
  return userRoles.some((role) => isUserRoleSufficient(role, requiredRole));
}

/**
 * Asynchronously writes the given text value to the system clipboard
 * @param {string} value - The text string to be copied to the clipboard
 * @returns {Promise<void>} - A Promise that resolves with no value when the text has been successfully copied.
 * The promise is rejected if the operation fails (e.g., due to lack of user permission
 * or an insecure context)
 */
export function copyToClipboard(value) {
  return navigator.clipboard.writeText(value);
}

/**
 * Converts a camelCase string to a human-readable Title Case string.
 * It inserts a space before every uppercase letter and uppercase the
 * first character of the resulting string.
 * @param {string} text - the camelCase string to tranform (e.g. 'lastModified')
 * @returns {string} - the formatted Title Case string (e.g. `Last Modified')
 */
export const camelToTitleCase = (text) => {
  const spaced = text.replace(/([A-Z])/g, ' $1');
  const titleCase = spaced.charAt(0).toUpperCase() + spaced.slice(1);
  return titleCase;
};

/**
 * Helper to trigger a download for a file
 * @param {string} url - The URL to the file source
 * @param {string} filename - The name of the file including the file extension
 * @returns {undefined}
 */
export const triggerDownload = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
};

/**
 * Downloads a file
 * @param {Blob|MediaSource} file - The file to download
 * @param {string} filename - The name of the file including the file extension
 * @returns {undefined}
 */
export const downloadFile = (file, filename) => {
  const url = URL.createObjectURL(file);
  try {
    triggerDownload(url, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
};

/**
 * Generates a rasterized image of a JSROOT RootObject and triggers download.
 * @param {string} filename - The name of the downloaded file excluding the file extension.
 * @param {string} filetype - The file extension of the downloaded file.
 * @param {RootObject} root - The JSROOT RootObject to render.
 * @param {string[]} [drawingOptions=[]] - Optional array of JSROOT drawing options.
 * @returns {undefined}
 */
export const downloadRoot = async (filename, filetype, root, drawingOptions = []) => {
  const mime = SUPPORTED_ROOT_IMAGE_FILE_TYPES[filetype];
  if (!mime) {
    throw new Error(`The file extension (${filetype}) is not supported`);
  }

  const image = await JSROOT.makeImage({
    object: root,
    option: generateDrawingOptionString(root, drawingOptions),
    format: filetype,
    as_buffer: true,
  });
  const blob = new Blob([image], { type: mime });
  downloadFile(blob, `${filename}.${filetype}`);
};

/**
 * Determines whether the element is positioned on the left half of the viewport.
 * This is used to decide which way a dropdown should anchor to stay within view.
 * @param {HTMLElement} element - The DOM element (usually the button or container) to measure.
 * @returns {boolean|undefined} Returns true if the element is on the left half of the window,
 * false if it is on the right half, or undefined if no element is provided.
 */
export const isOnLeftSideOfViewport = (element) => {
  if (!element) {
    return;
  }

  const rect = element.getBoundingClientRect();
  const isLeft = rect.left - rect.width < window.innerWidth / 2;
  return isLeft;
};
