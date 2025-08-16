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

import {h} from '/js/src/index.js';

/**
* Button to allow the user to download a file with logs from Messos
* @param {string} href - location of the mesos log
* @param {string} label - label to display on the button for the user
* @param {string} title - title to display on hover
* @param {boolean} openNewTab - open the link in a new tab
* @return {vnode} - button to download the mesos log
*/
export const redirectButtonLink = (href, label, title, openNewTab = false, classes = ['btn', 'primary']) =>
  h('a', {
    class: classes.join(' '),
    style: {display: !href ? 'none' : ''},
    title,
    href,
    target: openNewTab ? '_blank' : ''
  }, label);
