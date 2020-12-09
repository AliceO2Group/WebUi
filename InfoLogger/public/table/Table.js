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

import {Observable} from '/js/src/index.js';

/**
 * Model Table, encapsulate all changes of the table based on the user profile
 */
export default class Table extends Observable {
  /**
   * Instantiate Log class and its internal LogFilter
   * @param {Object} model
   */
  constructor(model) {
    super();

    this.model = model;
    this.colsHeader = this.resetColumnsHeaderToDefault();
  }

  /**
   * Sets the size of an already defined column
   * @param {string} size
   * @param {string} column
   */
  setSizeOfColumn(size, column) {
    if (this.colsHeader[column]) {
      this.colsHeader[column].size = size;
      this.notify();
    }
  }

  /**
   * Increase cell size by one position. If at max, reduce to minimum
   * @param {string} currentSize
   * @param {string} column
   */
  setNextSizeOfColumn(currentSize, column) {
    switch (currentSize) {
      case 'cell-xs':
        this.colsHeader[column].size = 'cell-s';
        break;
      case 'cell-s':
        this.colsHeader[column].size = 'cell-m';
        break;
      case 'cell-m':
        this.colsHeader[column].size = 'cell-l';
        break;
      case 'cell-l':
        this.colsHeader[column].size = 'cell-xl';
        break;
      case 'cell-xl':
        this.colsHeader[column].size = 'cell-xs';
        break;
      default:
        this.colsHeader[column].size = 'cell-xs';
    }
    this.notify();
  }

  /**
   * Toggle the visibility of the column
   * @param {stirng} column
   */
  toggleColumn(column) {
    if (this.colsHeader[column]) {
      this.colsHeader[column].visible = !this.colsHeader[column].visible;
      this.notify();
    }
  }

  /**
   * Set column visibility based on `isVisible`.
   * Hide the column if no value is passed
   * @param {string} fieldName - column of which the visibility will be set
   * @param {boolean} isVisible - hide/show the column
   */
  setColumnVisibility(fieldName, isVisible = false) {
    this.colsHeader[fieldName].visible = isVisible;
    this.notify();
  }

  /**
   * Method to reset what columns are displayed and their sizes
   * @return {JSON}
   */
  resetColumnsHeaderToDefault() {
    return {
      date: {
        size: 'cell-m',
        visible: false
      },
      time: {
        size: 'cell-m',
        visible: true,
      },
      hostname: {
        size: 'cell-m',
        visible: false,
      },
      rolename: {
        size: 'cell-m',
        visible: true,
      },
      pid: {
        size: 'cell-s',
        visible: false,
      },
      username: {
        size: 'cell-m',
        visible: false,
      },
      system: {
        size: 'cell-s',
        visible: true,
      },
      facility: {
        size: 'cell-m',
        visible: true,
      },
      detector: {
        size: 'cell-s',
        visible: false,
      },
      partition: {
        size: 'cell-m',
        visible: false,
      },
      run: {
        size: 'cell-s',
        visible: false,
      },
      errcode: {
        size: 'cell-s',
        visible: true,
      },
      errline: {
        size: 'cell-s',
        visible: false,
      },
      errsource: {
        size: 'cell-m',
        visible: false,
      },
      message: {
        size: 'cell-xl', // remaining
        visible: true,
      }
    };
  }
}
