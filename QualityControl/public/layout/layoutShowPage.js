import {h} from '/js/src/index.js';
import {draw} from '../object/objectDraw.js';
import {iconArrowLeft, iconArrowTop, iconResizeBoth, info} from '/js/src/icons.js';

/**
 * Exposes the page that shows one layout and its tabs (one at a time), this page can be in edit mode
 * LayoutShow is composed of:
 * - 1 main view function (the page itself)
 * - 1 subcanvasView to bind listeners and set a fixed height of page to allow dragging inside free space
 * - N chartView, one per chart with jsroot inside
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.scroll-y.absolute-fill.bg-gray-light', {id: 'canvas'}, subcanvasView(model));

/**
 * Simple placeholder when the layout is empty
 * @param {Object} model
 * @return {vnode}
 */
const emptyListViewMode = (model) => h('.m4', [
  h('h1', 'Empty list'),
  h('p', 'Owner can edit this tab to add objects to see.')
]);

/**
 * Placeholder for empty layout in edit mode
 * @param {Object} model
 * @return {vnode}
 */
const emptyListEditMode = (model) => h('.m4', [
  h('h1', 'Empty list'),
  h('p', [iconArrowLeft(), ' Add new objects from the sidebar tree.']),
  h('p', ['You can also add/remove tabs or save/delete this layout on the navbar. ', iconArrowTop()]),
]);

/**
 * Container of the different charts, height is fixed and listeners allow dragging
 * @param {Object} model
 * @return {vnode}
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

  // Sort the list by id to help template engine. It will only update style's positions and not DOM order
  // which could force recreate some charts and then have an unfriendly blink. The source array can be suffle
  // because of the GridList algo, the sort below avoid this.
  const tabObjects = cloneSortById(model.layout.tab.objects);

  const subcanvasAttributes = {
    style: {
      height: `${model.layout.cellHeight * model.layout.gridList.grid.length}%`
    },
    id: 'subcanvas',

    /**
     * Listens to dragover event to update model of moving chart position and compute grid state
     * @param {DragEvent} e - https://developer.mozilla.org/fr/docs/Web/Events/dragover
     */
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

      const cellWidth2 = canvasDimensions.width / model.layout.gridListSize;

      // position in the gridList
      const x = Math.floor(canvasX / cellWidth2);
      const y = Math.floor(canvasY / (canvas.offsetHeight * 0.95 / model.layout.gridListSize));

      // console.log(x, y, pageX, canvasDimensions.x);
      model.layout.moveTabObjectToPosition(x, y);
    },

    /**
     * Listens to dragend event to end any transparent moving chart from UI and other computing inside model
     */
    ondragend() {
      model.layout.moveTabObjectStop();
    }
  };

  return h('div', subcanvasAttributes, tabObjects.map((tabObject) => chartView(model, tabObject)));
}

/**
 * Shows a jsroot plot, with an overlay on edit mode to allow dragging events instead of dragging jsroot content with the mouse.
 * Dragging to desktop is forbidden, but could be added.
 * Position of chart is absolute to allow smooth movements when arrangement changes.
 * @param {Object} model
 * @param {Object} tabObject - to be drawn with jsroot
 * @return {vnode}
 */
function chartView(model, tabObject) {
  const key = 'key' + tabObject.id;

  // Position and size are produced by GridList in the model
  const style = {
    height: `${model.layout.cellHeight * tabObject.h}%`,
    width: `${model.layout.cellWidth * tabObject.w}%`,
    top: `${model.layout.cellHeight * tabObject.y}%`,
    left: `${model.layout.cellWidth * tabObject.x}%`,
    opacity: (model.layout.tabObjectMoving && tabObject.id === model.layout.tabObjectMoving.id ? '0' : '1')
  };

  // Interactions with user
  const draggable = model.layout.editEnabled;
  const ondragstart = model.layout.editEnabled ? (e) => {
    e.dataTransfer.setData('application/qcg', null); // custom type forbids to drag on desktop
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
    onremove: () => 1 // fix strange bug with unlimited redraws when layout contains only one chart (!!!)
  };

  let className = '';
  className += model.object.isObjectInOnlineList(tabObject.name) ? 'object-online ' : '';
  className += model.layout.editingTabObject && model.layout.editingTabObject.id === tabObject.id
    ? 'layout-selected layout-selectable '
    : 'layout-selectable ';
  const attrsInternal = {
    class: className
  };

  return h('.absolute.animate-dimensions-position', attrs, [
    // super-container of jsroot data
    h('.bg-white.m1.absolute-fill.shadow-level1.br3', attrsInternal, drawComponent(model, tabObject)),

    // transparent layer to drag&drop in edit mode, avoid interaction with jsroot
    model.layout.editEnabled && h('.object-edit-layer.absolute-fill.m1.br3')
  ]);
}

/**
 * Method to generate a component containing a header with actions and a jsroot plot
 * @param {Object} model
 * @param {String} tabObject
 * @return {vnode}
 */
const drawComponent = (model, tabObject) =>
  h('', {style: 'height:100%; display: flex; flex-direction: column'},
    [
      h('.jsrootdiv', {style: 'z-index: 90; height:100%; display: flex; flex-direction: column'},
        draw(model, tabObject, {}, 'layoutShow')),
      h('.text-right.resize-element.resize-button.flex-row', {
        style: 'display: none; padding: .25rem .25rem 0rem .25rem;'
      }, [
        !model.isOnlineModeEnabled &&
        h('.text-right', {style: 'padding-bottom: 0;'},
          h('.dropdown.mh1', {class: model.object.selectedOpen ? 'dropdown-open' : ''}, [
            h('button.btn',
              {
                title: 'View details about histogram',
                onclick: () => model.object.toggleInfoArea(tabObject.name)
              }, info()
            ),
            h('.dropdown-menu', {style: 'right:0.1em; left: auto; white-space: nowrap;'}, [
              h('.m2.gray-darker.text-center', [
                h('.menu-title', {style: 'font-weight: bold; margin-bottom: 0'}, 'PATH'),
                tabObject.name
              ]),
              h('.m2.gray-darker.text-center', [
                h('.menu-title', {style: 'font-weight: bold; margin-bottom: 0'}, 'LAST MODIFIED'),
                model.object.getLastModifiedByName(tabObject.name)
              ]),

            ]),
          ])
        ),
        h('a.btn', {
          title: 'Open object plot in full screen',
          href: `?page=objectView&objectId=${tabObject.id}&layoutId=${model.router.params.layoutId}`,
          onclick: (e) => model.router.handleLinkEvent(e)
        }, iconResizeBoth())
      ]),
    ]);

/**
 * Predicate to sort objects by id
 * @param {Object} a
 * @param {Object} b
 * @return {number}
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
 * @param {Array.<Object>} array
 * @return {Array.<Object>} copy
 */
function cloneSortById(array) {
  return array.concat().sort(compareById);
}
