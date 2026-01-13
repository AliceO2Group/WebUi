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

import { SortDirectionsEnum } from '../common/enums/columnSort.enum.js';
import { h, iconCircleX, iconArrowBottom, iconArrowTop } from '/js/src/index.js';

/**
 * Get the icon for the sort direction.
 * @param {SortDirectionsEnum} direction - direction of the sort.
 * @returns {vnode} the correct icon related to the direction.
 */
const getSortIcon = (direction) => {
  if (direction === SortDirectionsEnum.ASC) {
    return iconArrowTop();
  }
  if (direction === SortDirectionsEnum.DESC) {
    return iconArrowBottom();
  }
  return iconCircleX();
};

/**
 * @callback SortClickCallback
 * @param {string} label - The label of the column being sorted.
 * @param {number} order - The next sort direction in the cycle.
 * @param {vnode} icon - The VNode for the icon representing the next sort state.
 * @returns {void}
 */

/**
 * Renders a sortable table header button that cycles through sort states.
 * Displays the current sort icon and a preview icon of the next state on hover.
 * @param {object} props - The component properties.
 * @param {number} props.order - The current sort direction value from SortDirectionsEnum.
 * @param {object|undefined} props.icon - The VNode/element for the current active sort icon.
 * @param {string} props.label - The display text for the column header.
 * @param {SortClickCallback} props.onclick - Callback triggered on click.
 * @param {Array<number>} [props.sortOptions] - Array of SortDirectionsEnum values defining the
 * order of the sort cycle. Defaults to all enum values.
 * @returns {object} A HyperScript VNode representing the sortable button.
 */
export const sortableTableHead = ({
  order,
  icon,
  label,
  onclick,
  sortOptions = [...Object.values(SortDirectionsEnum)],
}) => {
  const currentIndex = sortOptions.indexOf(order);
  const nextIndex = (currentIndex + 1) % sortOptions.length;
  const nextSortOrder = sortOptions[nextIndex];
  const hoverIcon = getSortIcon(nextSortOrder);

  const directionLabel = Object.keys(SortDirectionsEnum).find((key) => SortDirectionsEnum[key] === nextSortOrder);

  return h(
    'button.btn.sort-button',
    {
      onclick: () => onclick(label, nextSortOrder, hoverIcon),
      title: `Sort ${directionLabel} by ${label}`,
    },
    [
      label,
      h('span.icon-container.mh1', [
        h('span.current-icon', [order != SortDirectionsEnum.NONE ? icon : undefined]),
        h('span.hover-icon', [getSortIcon(nextSortOrder)]),
      ]),
    ],
  );
};
