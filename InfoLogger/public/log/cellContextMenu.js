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

import { h, iconCheck, iconBan, iconClipboard, iconTrash } from '/js/src/index.js';

const MENU_WIDTH = 220;
const MENU_HEIGHT_ESTIMATE = 90;
const INSPECTOR_WIDTH_REM = 20;
const SEVERITY_CANVAS_WIDTH_PX = 10;

const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

/**
 * Clamp menu position so it stays within the viewport
 * @param {number} x mouse x position
 * @param {number} y mouse y position
 * @param {boolean} inspectorEnabled whether inspector panel is open
 * @returns {{left: number, top: number}} clamped menu position
 */
const clampPosition = (x, y, inspectorEnabled) => ({
  left: Math.max(0, Math.min(
    x,
    window.innerWidth - MENU_WIDTH - SEVERITY_CANVAS_WIDTH_PX - (inspectorEnabled ? remToPx(INSPECTOR_WIDTH_REM) : 0),
  )),
  top: Math.max(0, Math.min(y, window.innerHeight - MENU_HEIGHT_ESTIMATE)),
});

/**
 * Context menu for log table cells — allows quick filter actions.
 * Rendered at view root with position:fixed to avoid virtual scroll issues.
 * @param {Model} model root application model
 * @returns {Array|null} rendered menu nodes
 */
export default (model) => {
  const { contextMenu } = model.log;
  if (!contextMenu.isOpen) {
    return null;
  }

  const { field, value, x, y } = contextMenu;
  const pos = clampPosition(x, y, model.inspectorEnabled);

  const hideMenu = () => model.log.hideContextMenu();

  const isTimestamp = field === 'timestamp';

  return [
    // Full-screen transparent overlay to catch click-outside
    h('.cell-context-menu-overlay', {
      onclick: hideMenu,
      oncontextmenu: (e) => {
        e.preventDefault();
        hideMenu();
      },
    }),
    h('.cell-context-menu', {
      style: {
        left: `${pos.left}px`,
        top: `${pos.top}px`,
      },
    }, [
      h('div.cell-context-menu-header.f7', [
        h('span.f7', { style: { fontWeight: 'bold' } }, isTimestamp
          ? 'Timestamp' : field.charAt(0).toUpperCase() + field.slice(1)),
        h('span.f6.text-ellipsis', { title: value }, value),
      ]),
      createMenuItem(iconCheck(), 'var(--color-success)', isTimestamp ? 'From' : 'Match', () => {
        model.log.setCriteria(field, isTimestamp ? 'since' : 'match', value);
        hideMenu();
      }),
      createMenuItem(iconBan(), 'var(--color-danger)', isTimestamp ? 'To' : 'Exclude', () => {
        model.log.setCriteria(field, isTimestamp ? 'until' : 'exclude', value);
        hideMenu();
      }),
      createMenuItem(iconTrash(), 'var(--color-danger)', 'Clear filter', () => {
        model.log.setCriteria(field, isTimestamp ? 'until' : 'exclude', '');
        model.log.setCriteria(field, isTimestamp ? 'since' : 'match', '');
        hideMenu();
      }),
      createMenuItem(iconClipboard(), 'var(--color-primary)', 'Copy', () => {
        navigator.clipboard.writeText(value).catch(() => {
          model.notification.show('Failed to copy to clipboard', 'danger', 2000);
        });
        hideMenu();
      }),
    ]),
  ];
};

/**
 * Creates menu item for the context menu of a cell with given icon, label and click action.
 * @param {string} icon - icon to display in the menu item
 * @param {string} iconColor - color of the icon
 * @param {string} label - label to display in the menu item
 * @param {() => void} onClick - function to execute on click
 * @returns {vnode} - the menu item as a vnode
 */
function createMenuItem(icon, iconColor, label, onClick) {
  return h('.cell-context-menu-item.f7', {
    onclick: onClick,
  }, [
    h('span', { style: { color: iconColor } }, icon),
    h('span.ph2.w-100', { style: { fontWeight: 'bold' } }, label),
  ]);
}
