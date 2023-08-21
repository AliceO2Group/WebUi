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
import { draw } from '../../object/objectDraw.js';
import { iconArrowLeft, iconArrowTop } from '/js/src/icons.js';
import { layoutFiltersPanel } from './panels/filters.js';
import { minimalObjectInfo } from './panels/minimalObjectInfo.js';
import { objectInfoResizePanel } from './panels/objectInfoResizePanel.js';

/**
 * Exposes the page that shows one layout and its tabs (one at a time), this page can be in edit mode
 * LayoutShow is composed of:
 * - 1 main view function (the page itself)
 * - 1 subcanvasView to bind listeners and set a fixed height of page to allow dragging inside free space
 * - N chartView, one per chart with jsroot inside
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export default (model) => h('.scroll-y.absolute-fill.bg-gray-light', { id: 'canvas' }, subcanvasView(model));

/**
 * Simple placeholder when the layout is empty
 * @returns {vnode} - virtual node element
 */
const emptyListViewMode = () => h('.m4', [
  h('h1', 'Empty list'),
  h('p', 'Owner can edit this tab to add objects to see.'),
]);

/**
 * Placeholder for empty layout in edit mode
 * @returns {vnode} - virtual node element
 */
const emptyListEditMode = () => h('.m4', [
  h('h1', 'Empty list'),
  h('p', [iconArrowLeft(), ' Add new objects from the sidebar tree.']),
  h('p', ['You can also add/remove tabs or save/delete this layout on the navbar. ', iconArrowTop()]),
]);

/**
 * Container of the different charts, height is fixed and listeners allow dragging
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
function subcanvasView(model) {
  if (!model.layout.tab) {
    return;
  }

  if (!model.layout.tab.objects.length) {
    if (model.layout.editEnabled) {
      return emptyListEditMode(model);
    } else {
      return emptyListViewMode(model);
    }
  }

  /*
   * Sort the list by id to help template engine. It will only update style's positions and not DOM order
   * which could force recreate some charts and then have an unfriendly blink. The source array can be shuffle
   * because of the GridList algo, the sort below avoid this.
   */
  const tabObjects = cloneSortById(model.layout.tab.objects);

  const subcanvasAttributes = {
    style: {
      height: '100%',
      position: 'relative',
    },
    id: 'subcanvas',

    /**
     * Listens to dragover event to update model of moving chart position and compute grid state
     * @param {DragEvent} e - https://developer.mozilla.org/fr/docs/Web/Events/dragover
     * @returns {undefined}
     */
    ondragover(e) {
      /*
       * Warning CPU heavy function: getBoundingClientRect and offsetHeight re-compute layout
       * it is ok to use them on user interactions like clicks or drags
       */

      // Avoid events from other draggings things (files, etc.)
      if (!model.layout.tabObjectMoving) {
        return;
      }

      // Mouse position according to the viewport (scroll has no effect)
      const { pageX, pageY } = e;

      // Canvas is the div containing the subcanvas with screen dependent height (100% - navbar)
      const canvas = e.currentTarget.parentElement;

      // Subcanvas is the div contaning all graphs' divs, height is independent of the screen
      const subcanvas = e.currentTarget;

      const canvasDimensions = subcanvas.getBoundingClientRect();
      const canvasX = pageX - canvasDimensions.x;
      const canvasY = pageY - canvasDimensions.y;

      const cellWidth2 = canvasDimensions.width / model.layout.gridListSize;

      // Position in the gridList
      const x = Math.floor(canvasX / cellWidth2);
      const y = Math.floor(canvasY / (canvas.offsetHeight * 0.95 / model.layout.gridListSize));

      model.layout.moveTabObjectToPosition(x, y);
    },

    /**
     * Listens to dragend event to end any transparent moving chart from UI and other computing inside model
     * @returns {undefined}
     */
    ondragend() {
      model.layout.moveTabObjectStop();
    },
  };

  return h('.flex-column.absolute-fill', [
    !model.layout.editEnabled && layoutFiltersPanel(model),
    h('.p2', subcanvasAttributes, tabObjects.map((tabObject) => chartView(model, tabObject))),
  ]);
}

/**
 * Shows a jsroot plot, with an overlay on edit mode to allow dragging events instead of dragging jsroot
 * content with the mouse. Dragging to desktop is forbidden, but could be added.
 * Position of chart is absolute to allow smooth movements when arrangement changes.
 * @param {Model} model - root model of the application
 * @param {Object} tabObject - to be drawn with jsroot
 * @returns {vnode} - virtual node element
 */
function chartView(model, tabObject) {
  const key = `key${tabObject.id}`;

  // Position and size are produced by GridList in the model
  const style = {
    height: `${model.layout.cellHeight * tabObject.h}%`,
    width: `${model.layout.cellWidth * tabObject.w}%`,
    top: `${model.layout.cellHeight * tabObject.y}%`,
    left: `${model.layout.cellWidth * tabObject.x}%`,
    opacity: model.layout.tabObjectMoving && tabObject.id === model.layout.tabObjectMoving.id ? '0' : '1',
  };
  // Interactions with user
  const draggable = model.layout.editEnabled;
  const ondragstart = model.layout.editEnabled ? (e) => {
    e.dataTransfer.setData('application/qcg', null); // Custom type forbids to drag on desktop
    e.dataTransfer.effectAllowed = 'move';
    model.layout.moveTabObjectStart(tabObject);
  } : null;
  const onclick = model.layout.editEnabled ? () => model.layout.editTabObject(tabObject) : null;

  const attrs = {
    alt: key,
    key,
    style,
    draggable,
    ondragstart,
    onclick,
    onremove: () => 1, // Fix strange bug with unlimited redraws when layout contains only one chart (!!!)
  };

  let className = '';
  className += model.object.isObjectInOnlineList(tabObject.name) ? 'object-online ' : '';
  className += model.layout.editingTabObject && model.layout.editingTabObject.id === tabObject.id
    ? 'layout-selected layout-selectable '
    : 'layout-selectable ';
  const attrsInternal = {
    class: className,
  };

  return h('.absolute.animate-dimensions-position', attrs, [
    // Super-container of jsroot data
    h('.bg-white.m1.absolute-fill.br3', attrsInternal, drawComponent(model, tabObject)),

    // Transparent layer to drag&drop in edit mode, avoid interaction with jsroot
    model.layout.editEnabled && h('.object-edit-layer.absolute-fill.m1.br3'),
  ]);
}

/**
 * Method to generate a component containing a header with actions and a jsroot plot
 * @param {Model} model - root model of the application
 * @param {Object} tabObject - to be drawn with jsroot
 * @returns {vnode} - virtual node element
 */
const drawComponent = (model, tabObject) => h('', { style: 'height:100%; display: flex; flex-direction: column' }, [
  h('.jsrootdiv', {
    style: {
      'z-index': 90,
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      'flex-direction': 'column',
    },
  }, draw(model, tabObject, {})),
  objectInfoResizePanel(model, tabObject),
  !model.isOnlineModeEnabled && model.layout.item && model.layout.item.displayTimestamp
      && minimalObjectInfo(model, tabObject),
]);

/**
 * Predicate to sort objects by id
 * @param {Object} a - first object to compare
 * @param {Object} b - second object to compare with
 * @returns {number} - as to which element is in front
 */
function compareById(a, b) {
  if (a.id < b.id) {
    return -1;
  }

  if (a.id > b.id) {
    return 1;
  }

  return 0;
}

/**
 * Creates a copy of array and sort it by id's object
 * @param {Array.<Object>} array - list of elements to sort by id
 * @returns {Array.<Object>} copy
 */
function cloneSortById(array) {
  return array.concat().sort(compareById);
}
