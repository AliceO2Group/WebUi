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

/**
 * Builds a miniCard frame and adds inside the passed children
 * @param {Array<node>|string} title - components or string to be displayed as title
 * @param {Array<vnode>|vnode} [children] - child components to be added inside the miniCard
 * @param {Array<string>} [classes] - object containing style parameters
 * @returns {vnode}
 */
export const miniCard = (title, children = [], classes = ['p2', 'g2']) => h('.miniCard.flex-column.shadow-level1.br2', {
  class: classes.join(' '),
}, [
  !title
    ? undefined
    : typeof title === 'string'
      ? miniCardTitle(title)
      : title,
  children,
]);

/**
 * Builds a title group for a mini-card
 * @param {string} main - main part of the title group
 * @param {string} [sub] - optional sub-title to be added at the end of the title group
 * @returns {vnode}
 */
export const miniCardTitle = (main, sub = '') => h('.w-100.flex-row', [
  h('h4', {
    style: 'text-decoration: underline; flex-grow: 6;',
  }, main),
  sub && h('.text-right', {
    style: 'font-style: italic; flex-grow: 4;',
  }, sub),
]);
