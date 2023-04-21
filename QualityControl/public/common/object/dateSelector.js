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

import { h } from '/js/src/index.js';
import { prettyFormatDate } from './../utils.js';

/**
 * Display a select form with a given list of timestamps and optional callback
 * @param {number} selected - element that should be displayed as selected
 * @param {Array<number>} timestamps - list of timestamps available for an object in ms
 * @param {function} callback - onchange callback function
 * @returns {vnode} - select form with passed values
 */
export const dateSelector = (selected, timestamps, callback) => h(
  '.w-100.flex-row',
  h('select.form-control.gray-darker.text-center.w-25', {
    onchange: (e) => {
      const { value } = e.target;
      callback(undefined, value);
    },
  }, [
    timestamps
      .map((timestamp) => h('option.text-center', {
        value: timestamp,
        selected: Boolean(timestamp === selected),
      }, [
        prettyFormatDate(timestamp),
        ' (',
        timestamp,
        ')',
      ])),
  ]),
);
