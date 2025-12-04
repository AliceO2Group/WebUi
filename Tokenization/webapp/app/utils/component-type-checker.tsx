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

import React from 'react';

/**
 * One-line helper function which checks if a component is of a certain type
 *
 * @param {React.ReactNode} c - component to check
 * @param {React.ElementType} otype - component type to check against
 * @returns {Boolean} true if component is of the specified type, false otherwise
 */
export const checkIsComponentOfType = (c: React.ReactNode, otype: React.ElementType): boolean => React.isValidElement(c) && c.type === otype;
