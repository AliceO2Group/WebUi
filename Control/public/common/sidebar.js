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
import {
  iconGridTwoUp, iconGridThreeUp, iconExcerpt, iconPlus, iconMediaSkipBackward, iconMediaSkipForward, iconCog,
  iconCalculator, iconLockLocked, iconWrench
} from '/js/src/icons.js';

const HEADER = 'header';
const ITEM = 'item';
/**
 * Ordered list of sidebar menu entries
 * @type {Array<Object>}
 */
const sideBarMenuConfiguration = [
  { type: HEADER, title: 'Environments', acronym: 'ENVS' },
  { type: ITEM, title: 'Global Runs', navigateToPage: 'newEnvironment', icon: iconPlus },
  { type: ITEM, title: 'Calibration Runs', navigateToPage: 'calibrationRuns', icon: iconWrench },
  { type: ITEM, title: 'Active Environments', navigateToPage: 'environments', icon: iconGridTwoUp },
  { type: ITEM, title: 'Locks', navigateToPage: 'locks', icon: iconLockLocked },
  { type: HEADER, title: 'Expert', acronym: 'EXP' },
  { type: ITEM, title: 'Create', navigateToPage: 'newEnvironmentAdvanced', icon: iconPlus },
  { type: ITEM, title: 'Task list', navigateToPage: 'taskList', icon: iconGridThreeUp },
  { type: HEADER, title: 'Hardware', acronym: 'HDW' },
  { type: ITEM, title: 'Links', navigateToPage: 'configuration', icon: iconCog },
  { type: ITEM, title: 'FLPs', navigateToPage: 'hardware', icon: iconCalculator },
];

/**
 * Sidebar is the main navigation menu to choose pages though QueryRouter instance
 * @param {Model} model - application model
 * @return {vnode}
 */
export default (model) => {
  const { page: currentPage = '' } = model?.router?.params ?? {};
  const { sideBarMenu: isSidebarVisible = true } = model;
  
  /**
   * Onclick handler to delegate link handling to the QueryRouter
   * @param {Event} page - click event
   */
  const onclick = (page) => model.router.go(`?page=${page}`);

  return h('.absolute-fill.scroll-y.flex-column', [
    sideBarMenuConfiguration.map((menuEntry) => {
      const { type } = menuEntry;
      if (type === HEADER) {
        const { title, acronym } = menuEntry;
        const label = isSidebarVisible ? title : acronym;
        return menuHeader(label);
      } else if (type === ITEM) {
        const { title, navigateToPage, icon } = menuEntry;
        return menuItem({
          ...(isSidebarVisible && { title }),
          icon,
          onclick: () => onclick(navigateToPage),
          classes: currentPage === navigateToPage ? '.selected' : ''
        });
      }
    }),
    h('', { style: 'flex-grow:1' }), // empty item to fill in space
    menuItem({
      ...(isSidebarVisible && { title: 'About' }),
      icon: iconExcerpt,
      onclick: () => onclick('about'),
      classes: currentPage === 'about' ? '.selected' : ''
    }),
    menuItem({
      ...(isSidebarVisible && { title: 'Collapse Sidebar' }),
      icon: isSidebarVisible ? iconMediaSkipBackward : iconMediaSkipForward,
      onclick: () => model.toggleSideBarMenu(),
    }),
  ]);
};

/**
 * Create a non-clickable menu header to separate menu sections
 * @param {string} title - full title to be displayed when sidebar extended
 * @return {vnode}
 */
const menuHeader = (title) => h(`h5.menu-title-large.mh1$.text-center`, title);

/**
 * Create a clickable menu-item vnode
 * @param {function} icon - function to be used to build a vnode with icon to be displayed
 * @param {string} [title = undefined] - full title to be displayed when sidebar extended
 * @param {function} [onclick = () => { }] - onclick handler
 * @param {string} [classes = ''] - additional classes to be added to the menu item (e.g. .selected)
 * @return {vnode}
 */
const menuItem = ({ icon, title = undefined, onclick = () => { }, classes = '' }) => {
  return h(`a.menu-item.flex-row${classes}`, {
    title,
    onclick,
  }, [
    h('span', icon()),
    title &&  h('span.ph2', title)
  ]);
};
