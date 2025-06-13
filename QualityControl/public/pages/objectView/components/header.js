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

import { h, iconBook, iconArrowThickLeft } from '/js/src/index.js';
import { filterPanelToggleButton } from '../../../common/filters/filterViews.js';

/**
 * Builds header which contains information on plotted object and actions that can be applied
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export const objectViewHeader = (model) => {
  const { objectViewModel, filterModel, router } = model;
  const title = computeTitle(objectViewModel, router);

  return [
    h('.flex-column.text-center.justify-center.w-33', h('b', title)),
    h('.flex-row.items-center.p2.g2.w-33.justify-end', [
      getBackToQCGButton(objectViewModel, router),
      filterPanelToggleButton(filterModel),
      model.isContextSecure() && h('.flex-row', getCopyURLToClipboardButton(model)),
    ]),
  ];
};

const computeTitle = (objectViewModel, router) => {
  const { selected } = objectViewModel;
  const { objectName, objectId } = router.params;

  if (!objectId) {
    return objectName;
  }

  if (selected.isSuccess()) {
    const { path, layoutName } = selected.payload;
    return `${path} (from layout: ${layoutName})`;
  }

  return objectId;
};

/**
 * Button for redirecting the user back to QCG object tree page
 * @param {ObjectViewModel} objectViewModel - model that manages the state of the objectViewPage
 * @param {QueryRouter} router - root model of the application
 * @returns {vnode} - virtual node element
 */
function getBackToQCGButton(objectViewModel, router) {
  const { selected } = objectViewModel;
  const { layoutId = undefined } = router.params;

  let title = 'Back';
  let href = '?page=objectTree';
  if (layoutId) {
    title = 'Back to layout';
    href = `?page=layoutShow&layoutId=${layoutId}${getTabFromObject(selected)}`;
  }

  return h(
    '',
    h('a.btn', {
      title,
      href,
      onclick: (e) => router.handleLinkEvent(e),
    }, [
      iconArrowThickLeft(),
      ' ',
      title,
    ]),
  );
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

/**
 * Extract tab name from the selected object
 * @param {RemoteData} selected - contains the selected object
 * @returns {string} - name of the tab where the object is placed or empty string if not applicable
 */
function getTabFromObject(selected) {
  const tabName = selected?.payload?.tabName ?? '';
  return tabName ? `&tab=${tabName}` : '';
}
