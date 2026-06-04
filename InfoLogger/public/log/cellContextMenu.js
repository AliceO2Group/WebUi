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

import { h, iconCheck, iconBan, iconClipboard, iconTrash, iconMagnifyingGlass } from '/js/src/index.js';

const MENU_WIDTH = 220;
const MENU_HEIGHT_ESTIMATE = 236;
const FOOTER_HEIGHT = 26;
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
  top: Math.max(0, Math.min(y, window.innerHeight - MENU_HEIGHT_ESTIMATE - FOOTER_HEIGHT)),
});

/**
 * Context menu for log table cells — allows quick filter actions.
 * Rendered at view root with position:fixed to avoid virtual scroll issues.
 * @param {Model} model root application model
 * @returns {Array|null} rendered menu nodes
 */
export const cellContextMenu = (model) => {
  const { contextMenu } = model.log;
  if (!contextMenu.isOpen) {
    return null;
  }

  const { field, value, x, y } = contextMenu;
  const pos = clampPosition(x, y, model.inspectorEnabled);

  const hideMenu = () => contextMenu.hide();

  const isTimestamp = field === 'timestamp';

  const appendFilter = (operator) => {
    const separator = field === 'message' ? '\n' : ' ';
    const existing = model.log.filter.criterias[field][operator] || '';
    const parts = existing ? existing.split(separator) : [];
    if (!parts.includes(value)) {
      parts.push(value);
    }
    return parts.join(separator);
  };

  const filterItems = () => {
    if (field === 'severity') {
      const isActive = model.log.filter.criterias.severity.$in?.includes(value);
      return [
        createMenuItem(
          iconCheck(),
          'success',
          'Show Severity',
          () => {
            model.log.setCriteria('severity', 'in', value);
            hideMenu();
          },
          isActive,
        ),
        createMenuItem(
          iconBan(),
          'danger',
          'Hide Severity',
          () => {
            model.log.setCriteria('severity', 'in', value);
            hideMenu();
          },
          !isActive,
        ),
        createMenuItem(iconTrash(), 'danger', 'Reset Severity Filter', () => {
          model.log.filter.setCriteria('severity', 'in', 'I W E F');
          hideMenu();
        }, model.log.filter.criterias.severity.in === 'I W E F'),
      ];
    }
    if (field === 'level') {
      const numValue = Number(value);
      const thresholds = [
        { max: 1, label: 'Ops' },
        { max: 6, label: 'Support' },
        { max: 11, label: 'Devel' },
      ];
      const include = thresholds.find((t) => t.max >= numValue);
      const exclude = [...thresholds].reverse().find((t) => t.max < numValue);
      return [
        createMenuItem(
          iconCheck(),
          'success',
          include ? `Set Level To ${include.label}` : 'Show All Levels',
          () => {
            model.log.setCriteria('level', 'max', include?.max ?? null);
            hideMenu();
          },
        ),
        createMenuItem(
          iconBan(),
          'danger',
          exclude ? `Set Level To ${exclude.label}` : 'Show All Levels',
          () => {
            model.log.setCriteria('level', 'max', exclude?.max ?? null);
            hideMenu();
          },
        ),
        createMenuItem(iconTrash(), 'danger', 'Reset Level Filter', () => {
          model.log.setCriteria('level', 'max', 1);
          hideMenu();
        }, model.log.filter.criterias.level.max === 1),
      ];
    }
    if (isTimestamp) {
      const { since, until } = model.log.filter.criterias.timestamp;
      return [
        createMenuItem(iconCheck(), 'success', 'From', () => {
          model.log.setCriteria('timestamp', 'since', value);
          hideMenu();
        }),
        createMenuItem(iconBan(), 'danger', 'To', () => {
          model.log.setCriteria('timestamp', 'until', value);
          hideMenu();
        }),
        createMenuItem(iconTrash(), 'danger', 'Clear Filter', () => {
          model.log.setCriteria('timestamp', 'since', '');
          model.log.setCriteria('timestamp', 'until', '');
          hideMenu();
        }, !since && !until),
      ];
    }

    const { match, exclude, matchEmpty, excludeEmpty } = model.log.filter.criterias[field];
    const isClear = !match && !exclude && !matchEmpty && !excludeEmpty;

    return [
      createMenuItem(iconCheck(), 'success', 'Match', () => {
        model.log.setCriteria(field, 'match', appendFilter('match'));
        hideMenu();
      }),
      createMenuItem(iconBan(), 'danger', 'Exclude', () => {
        model.log.setCriteria(field, 'exclude', appendFilter('exclude'));
        hideMenu();
      }),
      createMenuItem(iconTrash(), 'danger', 'Clear Filter', () => {
        model.log.setCriteria(field, 'match', '');
        model.log.setCriteria(field, 'exclude', '');
        model.log.setCriteria(field, 'matchEmpty', false);
        model.log.setCriteria(field, 'excludeEmpty', false);
        hideMenu();
      }, isClear),
    ];
  };

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
      ...filterItems(),
      createMenuItem(iconClipboard(), 'primary', 'Copy', () => {
        navigator.clipboard.writeText(value).catch(() => {
          model.notification.show('Failed to copy to clipboard', 'danger', 2000);
        });
        hideMenu();
      }),
      createMenuItem(iconMagnifyingGlass(), 'primary', 'Open Inspector', () => {
        if (!model.inspectorEnabled) {
          model.toggleInspector();
        }
        hideMenu();
      }),
    ]),
  ];
};

/**
 * Creates menu item for the context menu of a cell with given icon, label and click action.
 * @param {vnode} icon - icon to display in the menu item
 * @param {string} iconClass - CSS class for the icon color (e.g. 'success', 'danger', 'primary')
 * @param {string} label - label to display in the menu item
 * @param {() => void} onClick - function to execute on click
 * @param {boolean} disabled - whether the menu item should be disabled
 * @returns {vnode} - the menu item as a vnode
 */
function createMenuItem(icon, iconClass, label, onClick, disabled = false) {
  return h('.cell-context-menu-item.f7', {
    onclick: disabled ? null : onClick,
    className: disabled ? 'disabled' : '',
  }, [
    h(`span.${iconClass}`, icon),
    h('span.ph2.w-100', { style: { fontWeight: 'bold' } }, label),
  ]);
}
