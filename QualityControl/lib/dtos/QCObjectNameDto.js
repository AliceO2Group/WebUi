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
import { LogManager } from '@aliceo2/web-ui';

const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/qcObj-Dto`);

/**
 * Validates if a path segment is valid (non-empty and no whitespace)
 * @param {string} path - The path to validate
 * @returns {boolean} True if the path is valid
 */
function isValidPath(path) {
  if (typeof path !== 'string' || path === '') {
    logger.debugMessage(`Invalid path: Path is empty or not a string (${path})`);
    return false;
  }

  let segmentStart = 0;

  for (let i = 0; i < path.length; i++) {
    const char = path[i];
    if (i === path.length || char === '/') {
      const segment = path.slice(segmentStart, i);
      const hasWhitespace = /\s/.test(segment);
      if (segment.length === 0) {
        logger.debugMessage(`Invalid path: Empty segment found in path (${path})`);
        return false;
      }
      if (hasWhitespace) {
        logger.debugMessage(`Invalid path: Segment contains whitespace (${segment}) in path (${path})`);
        return false;
      }
      segmentStart = i + 1;
    }
  }

  return true;
}

/**
 * Joi schema that validates the path
 */
export const qcObjectNameDto = Joi.string()
  .custom((value) => {
    if (!isValidPath(value)) {
      logger.debugMessage(`Found invalid QC object name: ${value}`);
      return value;
    }
    return value;
  }, 'QC Object Name Validator');

export const qcObjectNameArrayDto = Joi.array()
  .items(qcObjectNameDto)
  .custom((value) => {
    const filtered = value.filter((item) => isValidPath(item));

    if (filtered.length !== value.length) {
      logger.debugMessage(`Filtered ${value.length - filtered.length} invalid QC object names from array`);
    }

    return filtered;
  }, 'QC Object Array Validator');
