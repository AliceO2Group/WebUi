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
 * Enumeration for allowed `ROOT.makeImage` file extensions to MIME types
 * @enum {string}
 * @readonly
 */
export const RootImageDownloadSupportedTypes = Object.freeze({
  SVG: 'image/svg+xml',
  PNG: 'file/png',
  JPG: 'file/jpeg',
  JPEG: 'file/jpeg',
  WEBP: 'file/webp',
});

/**
 * Get the list of unique supported ROOT image download extensions
 * @returns {string[]} - Array of supported ROOT image download extensions
 */
export const RootImageDownloadExtensions = () => {
  const extensions = new Set();
  Object.keys(RootImageDownloadSupportedTypes)
    .forEach((ext) => extensions.add(ext.toLowerCase()));
  return Array.from(extensions);
};
