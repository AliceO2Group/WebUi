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

import Joi from 'joi';

/**
 * Sanitizes path segments containing whitespace or empty segments
 * @param {string} path - The path to sanitize
 * @returns {string} Sanitized path with invalid segments replaced
 */
function sanitizePath(path) {
  if (typeof path !== 'string' || path === '') {
    return '<invalid-name>';
  }

  const result = [];
  let segmentStart = 0;

  for (let i = 0; i <= path.length; i++) {
    const char = path[i];
    if (i === path.length || char === '/') {
      const segment = path.slice(segmentStart, i);
      const hasWhitespace = /\s/.test(segment);
      result.push(segment.length > 0 && !hasWhitespace ? segment : '<invalid-name>');
      segmentStart = i + 1;
    }
  }

  return result.join('/');
}

/**
 * Joi schema that first sanitizes then validates the path
 */
export const qcObjectNameDto = Joi.string()
  .custom((value) => {
    const sanitized = sanitizePath(value);
    return sanitized === value ? value : sanitized;
  });

export const qcObjectNameArrayDto = Joi.array()
  .items(qcObjectNameDto);
