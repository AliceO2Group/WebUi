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

import { Observable } from '/js/src/index.js';

/**
 * Model for log table zoom, controls row font size and height scaling
 */
export default class Zoom extends Observable {
  constructor() {
    super();

    this.level = 1;
    this.min = 0.5;
    this.max = 4;
    this.step = 0.1;
    this.baseFontSize = 0.7;
    this.rowHeightRatio = 1.3;
    this.lastScrollTime = 0;
  }

  /**
   * Font size in rem units
   * @returns {number} - font size in rem units
   */
  get fontSize() {
    return this.baseFontSize * this.level;
  }

  /**
   * Row height in rem units, computed with font size to keep the same ratio across zoom levels
   * @returns {number} - row height in rem units
   */
  get rowHeightRem() {
    return this.fontSize * this.rowHeightRatio;
  }

  /**
   * Row height in pixels, used for the virtual scroll to know how many logs to render depending on the container size
   * @returns {number} - row height in pixels
   */
  get rowHeightPx() {
    return this.rowHeightRem * parseFloat(getComputedStyle(document.documentElement).fontSize);
  }

  /**
   * Zoom in by increasing zoom level by step, with a maximum of zoom.max
   */
  zoomIn() {
    this.#setZoomLevel(Math.min(this.level + this.step, this.max));
  }

  /**
   * Zoom out by decreasing zoom level by step, with a minimum of zoom.min
   */
  zoomOut() {
    this.#setZoomLevel(Math.max(this.level - this.step, this.min));
  }

  /**
   * Reset zoom to base level of 1
   */
  resetZoom() {
    this.#setZoomLevel(1);
  }

  /**
   * Set zoom level
   * @param {number} level - zoom level to set, should be between zoom.min and zoom.max
   */
  #setZoomLevel(level) {
    // Keep zoom to 2 d.p. to avoid floating-point artifacts (for example 1.2000000000000002)
    // This keeps CSS values stable and ensures users can reliably return to default zoom (1)
    this.level = parseFloat(level.toFixed(2));
    const root = document.querySelector('.logs-container');
    if (root) {
      // Keep CSS sizes to 3 d.p. to avoid floating-point artifacts (for example 1.0920000000000002rem)
      root.style.setProperty('--log-font-size', `${this.fontSize.toFixed(3)}rem`);
      root.style.setProperty('--row-height', `${this.rowHeightRem.toFixed(3)}rem`);
    }
    this.notify();
  }
}
