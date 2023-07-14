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

import { h, iconBook, iconArrowThickLeft, iconChevronBottom, iconChevronTop } from '/js/src/index.js';

/**
 * Builds header which contains information on plotted object and actions that can be applied
 * @param {Model} model - root model of the application
 * @param {string} title - title of the page depending on the object loading location (tree or layout)
 * @returns {vnode} - virtual node element
 */
export const header = (model, title) => h('.flex-row.items-center.p2.g2', [
  getBackToQCGButton(model),
  h('.flex-column.text-center', { style: 'flex-grow:1' }, h('b', title)),
  filterByParametersButton(model.objectViewModel),
  model.isContextSecure() && h('.flex-row', getCopyURLToClipboardButton(model)),
]);

/**
 * Button for redirecting the user back to QCG object tree page
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
function getBackToQCGButton(model) {
  const { layoutId = undefined } = model.router.params;
  let title = 'Back';
  let href = '?page=objectTree';
  if (layoutId) {
    title = 'Back to layout';
    href = `?page=layoutShow&layoutId=${layoutId}`;
  }

  return h(
    '',
    h('a.btn', {
      title,
      href,
      onclick: (e) => model.router.handleLinkEvent(e),
    }, [
      iconArrowThickLeft(),
      ' ',
      title,
    ]),
  );
}

/**
 * Button for toggling visibility of the filter by parameters panel
 * @param {ObjectViewModel} objectViewModel - model of the current page
 * @returns {vnode} - virtual node element
 */
function filterByParametersButton(objectViewModel) {
  return h('button.btn.btn-default', {
    class: objectViewModel.isFilterVisible() ? 'active' : '',
    onclick: () => objectViewModel.toggleFilterVisibility(),
  }, ['Filters ', objectViewModel.isFilterVisible() ? iconChevronTop() : iconChevronBottom()]);
}

/**
 * Copy current location to the user's clipboard
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
function getCopyURLToClipboardButton(model) {
  return h('', h(
    'button.btn',
    {
      title: 'Copy URL Object',
      onclick: () => {
        model.notification.show('URL has been successfully copied to clipboard', 'success', 1500);
        navigator.clipboard.writeText(model.router.getUrl().href);
      },
    },
    [iconBook(), ' ', 'Copy URL'],
  ));
}
