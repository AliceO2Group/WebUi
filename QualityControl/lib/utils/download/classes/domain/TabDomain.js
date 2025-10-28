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
/** @import { ObjectDomain } from './ObjectDomain.js'; */

export class TabDomain {
  /**
   * constructor
   * @param {string} id - id
   * @param {string} name - name
   * @param {ObjectDomain[]} objects - objects
   */
  constructor(id, name, objects) {
    this.id = id,
    this.name = name,
    this.objects = objects;
  }

  id;

  name;

  objects;
}
