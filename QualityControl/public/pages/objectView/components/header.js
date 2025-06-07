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
import { getUrlPathFromObject } from '../../../common/filterToFromUrlParams.js';
import { filterPanelToggleButton } from '../../../common/filters/filterViews.js';

/**
 * Builds header which contains information on plotted object and actions that can be applied
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export const objectViewHeader = (model) => {
  const { filterModel, router } = model;
  const title = computeTitle(filterModel, router);

  return [
    h('.flex-column.text-center.justify-center.w-33', h('b', title)),
    h('.flex-row.items-center.p2.g2.w-33.justify-end', [
      getBackToQCGButton(model),
      filterPanelToggleButton(filterModel),
      model.isContextSecure() && h('.flex-row', getCopyURLToClipboardButton(model)),
    ]),
  ];
};

const computeTitle = (objectViewModel, router) => {
  const { selected } = objectViewModel;
  const { objectName, objectId } = router.params;
  let title = objectName;

  if (objectId) {
    if (selected.isSuccess()) {
      const { path, layoutName } = selected.payload;
      title = `${path} (from layout: ${layoutName})`;
    } else {
      title = objectId;
    }
  }

  return title;
};

/**
 * Button for redirecting the user back to QCG object tree page
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
function getBackToQCGButton(model) {
  const { router, objectViewModel: { filter, selected } } = model;
  const { layoutId = undefined } = router.params;

  let title = 'Back';
  let href = '?page=objectTree';
  if (layoutId) {
    title = 'Back to layout';
    href = `?page=layoutShow&layoutId=${layoutId}${getUrlPathFromObject(filter)}${getTabFromObject(selected)}`;
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
