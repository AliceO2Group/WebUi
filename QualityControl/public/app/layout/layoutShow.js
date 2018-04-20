import {h} from '/js/src/index.js';
import {draw} from '../object/objectDraw.js';
import {iconArrowLeft, iconArrowTop} from '/js/src/icons.js';

const cellHeight = 100 / 3 * 0.95; // %, put some margin at bottom to see below
const cellWidth = 100 / 3; // %

/*
LayoutShow is composed of:
- 1 canvasView
- 1 subcanvasView
- N chartView
*/

export default function canvasView(model) {
  return h('.scroll-y.absolute-fill.bg-gray-light', {id: 'canvas'}, subcanvasView(model));
}

function emptyListViewMode(model) {
  return h('.m4', [
    h('h1', 'Empty list'),
    h('p', 'Owner can edit this tab to add objects to see.')
  ]);
}

function emptyListEditMode(model) {
  return h('.m4', [
    h('h1', 'Empty list'),
    h('p', [iconArrowLeft(), ' Add new objects from the sidebar tree.']),
    h('p', ['You can also add/remove tabs or save/delete this layout on the navbar. ', iconArrowTop()]),
  ]);
}

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

  // Sort the list by id to help template engine. It will only update style's positions and not DOM order
  // which could force recreate some charts and then have an unfriendly blink. The source array can be suffle
  // because of the GridList algo, the sort below avoid this.
  const tabObjects = cloneSortById(model.layout.tab.objects);

  const subcanvasAttributes = {
    style: {
      height: `${cellHeight * model.layout.gridList.grid.length}%`
    },
    id: 'subcanvas',
    ondragover(e) {
      // Warning CPU heavy function: getBoundingClientRect and offsetHeight re-compute layout
      // it is ok to use them on user interactions like clicks or drags

      // avoid events from other draggings things (files, etc.)
      if (!model.layout.tabObjectMoving) {
        return;
      }

      // mouse position according to the viewport (scroll has no effect)
      const pageX = e.pageX;
      const pageY = e.pageY;

      // canvas is the div containing the subcanvas with screen dependent height (100% - navbar)
      const canvas = e.currentTarget.parentElement;

      // subcanvas is the div contaning all graphs' divs, height is independent of the screen
      const subcanvas = e.currentTarget;

      const canvasDimensions = subcanvas.getBoundingClientRect();
      const canvasX = pageX - canvasDimensions.x;
      const canvasY = pageY - canvasDimensions.y;

      const cellWidth2 = canvasDimensions.width / 3;

      // position in the gridList
      const x = Math.floor(canvasX / cellWidth2);
      const y = Math.floor(canvasY / (canvas.offsetHeight * 0.95 / 3));

      // console.log(x, y, pageX, canvasDimensions.x);
      model.layout.moveTabObjectToPosition(x, y);
    },
    ondragend(e) {
      model.layout.moveTabObjectStop();
    }
  };

  return h('div', subcanvasAttributes, tabObjects.map((tabObject) => chartView(model, tabObject)));
}

function chartView(model, tabObject) {
  const key = 'key'+tabObject.id;

  // Position and size are produced by GridList in the model
  const style = {
    height: `${cellHeight * tabObject.h}%`,
    width: `${cellWidth * tabObject.w}%`,
    top: `${cellHeight * tabObject.y}%`,
    left: `${cellWidth * tabObject.x}%`,
    opacity: (model.layout.tabObjectMoving && tabObject.id === model.layout.tabObjectMoving.id ? '0' : '1')
  };

  // Interactions with user
  const draggable = model.layout.editEnabled;
  const ondragstart = model.layout.editEnabled ? () => model.layout.moveTabObjectStart(tabObject) : null;
  const onclick = model.layout.editEnabled ? () => model.layout.editTabObject(tabObject) : null;

  const attrs = {
    alt: key,
    key,
    style,
    draggable,
    ondragstart,
    onclick,
    onremove: () => 1 // fix strange bug with unlimited redraws when layout contains only one chart (!!!)
  };

  const attrsInternal = {
    class: model.layout.editingTabObject && model.layout.editingTabObject.id === tabObject.id ? 'object-selected' : ''
  };

  return h('.absolute.animate-dimensions-position', attrs, [
    h('.bg-white.m1.absolute-fill.object-shadow.br3', attrsInternal, draw(model, tabObject)),
    model.layout.editEnabled && h('.object-edit-layer.absolute-fill.m1.br3')
  ]);
}

function compareById(a, b) {
  if (a.id < b.id)
    return -1;
  if (a.id > b.id)
    return 1;
  return 0;
}

function cloneSortById(array) {
  return array.concat().sort(compareById);
}
