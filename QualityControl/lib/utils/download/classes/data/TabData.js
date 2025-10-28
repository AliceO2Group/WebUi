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
/* eslint-disable jsdoc/reject-any-type */
import { TabDomain } from '../domain/TabDomain.js';
import { ObjectData } from './ObjectData.js';

export class TabData {
  /**
   * constructor
   * @param {string} id - id
   * @param {string} name - name of tab
   * @param {ObjectData[]} objects - objects within tab
   * @param {number} columns - columnds
   */
  constructor(id, name, objects, columns) {
    this.id = id,
    this.name = name,
    this.objects = objects,
    this.columns = columns;
  }

  id;

  name;

  objects;

  columns;

  /**
   * mapFromPlain, map to an instance of TabData from a plain object.
   * @static
   * @param {any} tabPlain - plain object of tab.
   * @returns {TabData} - mapped TabData.
   */
  static mapFromPlain(tabPlain) {
    if (!tabPlain || typeof tabPlain !== 'object') {
      throw new Error('invalid tab');
    }
    return new TabData(tabPlain.id, tabPlain.name, Array.isArray(tabPlain.objects) ?
      tabPlain.objects.map(ObjectData.mapFromPlain) : [], Number(tabPlain.columns));
  }

  /**
   * mapper to Domain model.
   * @returns {TabDomain} - mapped TabDomain.
   */
  mapToDomain() {
    return new TabDomain(this.id, this.name, this.objects.map((object) => object.mapToDomain()));
  }
}
