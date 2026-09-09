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
 * Logs selected by dragging over or clicking the rows of the main table.
 *
 * The selection is kept as two indexes in `Log.list`:
 * * `anchor` - the row on which the drag started
 * * `focus` - the row the pointer is currently on
 *
 * Storing indexes instead of log references keeps makes the selection independent of the
 * virtual scrolling.
 *
 * Inspired by https://developer.mozilla.org/en-US/docs/Web/API/Selection
 */
export default class LogSelection {
  /**
   * Initialize with nothing selected
   * @param {Log} log - log model owning this selection
   */
  constructor(log) {
    this.log = log;

    this.anchor = null;
    this.focus = null;

    this.isDragging = false; // a mouse button is held down on the table
    this.hasDragged = false; // the current/last drag went over more than the anchor row
  }

  /**
   * Whether at least one log is selected
   * @returns {boolean} - true if at least one log is selected
   */
  get isActive() {
    return this.anchor !== null && this.focus !== null;
  }

  /**
   * Whether the selection is at most one log is selected
   * As in the DOM Selection API, an empty selection is collapsed.
   * @returns {boolean} - true if at most one log is selected
   */
  get isCollapsed() {
    return !this.isActive || this.anchor === this.focus;
  }

  /**
   * Index of the first selected log, null if nothing is selected
   * @returns {number|null} - index in `Log.list`
   */
  get from() {
    return this.isActive ? Math.min(this.anchor, this.focus) : null;
  }

  /**
   * Index of the last selected log, null if nothing is selected
   * @returns {number|null} - index in `Log.list`
   */
  get to() {
    return this.isActive ? Math.max(this.anchor, this.focus) : null;
  }

  /**
   * Logs currently selected, in the order they are displayed
   * @returns {Array<object>} - selected logs, empty if nothing is selected
   */
  get items() {
    return this.isActive ? this.log.list.slice(this.from, this.to + 1) : [];
  }

  /**
   * Whether the log at the given index is part of the selection
   * @param {number} index - index in `Log.list`
   * @returns {boolean} - true if the log is selected
   */
  has(index) {
    return this.isActive && index >= this.from && index <= this.to;
  }

  /**
   * Start a drag on the given row, which becomes the only selected log
   * @param {number} index - index in `Log.list` of the row the drag starts on
   */
  begin(index) {
    this.collapseTo(index);
    this.log.autoScrollToItem = false; // selecting a row directly is not a request to scroll to it
    this.isDragging = true;
    this.hasDragged = false;
  }

  /**
   * Move the focus of the selection to the given row, keeping the anchor where it is.
   * A selection only extends once it leaves the row it started on.
   * Does nothing if there is no selection to extend or if the row is outside the list.
   * @param {number} index - index in `Log.list` of the row to extend the selection to
   */
  extendTo(index) {
    if (!this.isActive || index === this.focus || index < 0 || index >= this.log.list.length) {
      return;
    }
    this.focus = index;
    this.hasDragged = true;
    this.log.notify();
  }

  /**
   * End the on-going drag, the selected range is kept
   */
  end() {
    this.isDragging = false;
  }

  /**
   * Whether the click being handled is the end of a drag, in which case it should not be
   * treated as a single log selection. Reading it consumes the flag.
   * @returns {boolean} - true if a drag just ended
   */
  consumeDrag() {
    const { hasDragged } = this;
    this.hasDragged = false;
    return hasDragged;
  }

  /**
   * Drop the selection
   */
  clear() {
    this.anchor = null;
    this.focus = null;
    this.hasDragged = false;
  }

  /**
   * Keep the selection on the same logs after logs were removed from the head of the list
   * in live mode. The selection is dropped if it scrolled out entirely.
   * @param {number} count - number of logs removed from the beginning of `Log.list`
   */
  shiftBy(count) {
    if (!this.isActive) {
      return;
    }
    if (this.to - count < 0) {
      this.clear();
      return;
    }
    this.anchor = Math.max(this.anchor - count, 0);
    this.focus = Math.max(this.focus - count, 0);
  }

  /**
   * Collapse the selection on a single log. An index outside of the list drops the selection.
   * @param {number} index - index in `Log.list` of the log to select
   */
  collapseTo(index) {
    if (index === null || index < 0 || index >= this.log.list.length) {
      this.clear();
      return;
    }
    this.anchor = index;
    this.focus = index;
  }
}
