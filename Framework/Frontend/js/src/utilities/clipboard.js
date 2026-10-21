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

/* Global: window, navigator */

import { isContextSecure } from './browserContext.js';

/**
 * Returns why the clipboard cannot be written to in the current context, if anything prevents it.
 * @returns {string|null} A descriptive reason if the clipboard is unavailable, `null` otherwise.
 */
export const getClipboardUnavailableReason = () => {
  if (!isContextSecure()) {
    return 'Clipboard not available in a non-secure context.';
  }

  if (!navigator.clipboard) {
    return 'Clipboard API is not supported in this browser.';
  }

  if (window !== window.parent) {
    return 'Clipboard access is restricted in iframes.';
  }

  return null;
};

/**
 * Writes the given text to the user's clipboard.
 * @param {string} value - The text to be copied to the clipboard.
 * @returns {Promise<void>} Resolves once the text has been written.
 * @throws {Error} If the clipboard is unavailable or the write is rejected.
 */
export const copyToClipboard = async (value) => {
  const unavailableReason = getClipboardUnavailableReason();
  if (unavailableReason) {
    throw new Error(unavailableReason);
  }

  await navigator.clipboard.writeText(value);
};
