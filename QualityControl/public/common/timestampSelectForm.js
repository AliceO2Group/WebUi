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
import { prettyFormatDate } from './utils.js';

/**
 * Display a select form with the latest timestamps of the current selected object
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export const timestampSelectForm = ({ versions = [], selectedId = null, onSelect }) =>
  h(
    '.w-100.flex-row',
    h('select.form-control.gray-darker.text-center', {
      onchange: (e) => {
        const { value } = e.target;
        if (value && value !== 'Invalid Timestamp') {
          onSelect?.(JSON.parse(value));
        }
      },
    }, versions.map((version) => {
      const versionString = JSON.stringify(version);
      return h('option.text-center', {
        id: versionString,
        key: versionString,
        value: versionString,
        selected: selectedId ? version.id === selectedId : false,
      }, [
        'Created: ',
        prettyFormatDate(version.createdAt),
        ' (id: ',
        version.id,
        ')',
      ]);
    })),
  );
