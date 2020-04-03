/* global JSROOT */

import {h} from '/js/src/index.js';
import {timerDebouncer, pointerId} from '../common/utils.js';
import checkersPanel from './checkersPanel.js';

/**
 * Draw an object using JSROOT.
 * Many JSROOT actions depends on events and model change:
 * replace element on tabObject change (id)
 * resize element on tabObject size change (w, h)
 * resize element on window size change
 * redraw element on data changed (pointerId of object)
 * clean-redraw element on options changed
 * see fingerprint functions at bottom
 * fingerprints are stored in DOM datasets to keep view internal state
 *
 * @param {object} model - root model object
 * @param {TabObject|string} tabObject - the tabObject to draw, can be the name of object
 * @param {object} options - optional options of presentation
 * @param {string} location - location from where `draw` method is called; Used for different style
 * @return {vdom} output virtual-dom, a single div with JSROOT attached to it
 */
export function draw(model, tabObject, options, location = '') {
  const defaultOptions = {
    width: '100%', // CSS size
    height: '100%', // CSS size
    className: '', // any CSS class
  };

  options = Object.assign({}, defaultOptions, options);
  const drawingOptions = [];
  if (options.stat) {
    drawingOptions.push('stat');
    delete options.stat;
  }
  if (typeof tabObject === 'string') {
    tabObject = {
      id: tabObject,
      name: tabObject,
      options: drawingOptions,
      x: 0,
      y: 0,
      h: 0,
      w: 0,
    };
  }
  model.object.addObjectByName(tabObject.name);

  const attributes = {
    'data-fingerprint-key': fingerprintReplacement(tabObject), // just for humans in inspector
    key: fingerprintReplacement(tabObject), // completely re-create this div if the chart is not the same at all
    class: options.className,
    style: {
      height: options.height,
      width: options.width
    },

    /**
     * Called when vnode has been created as a DOM element
     * @param {vnode} vnode
     */
    oncreate(vnode) {
      // ask model to load data to be shown

      // setup resize function
      vnode.dom.onresize = timerDebouncer(() => {
        if (JSROOT.resize) {
          // resize might not be loaded yet
          JSROOT.resize(vnode.dom);
        }
      }, 200);

      // resize on window size change
      window.addEventListener('resize', vnode.dom.onresize);

      // JSROOT setup
      redrawOnDataUpdate(model, vnode.dom, tabObject);
      resizeOnSizeUpdate(model, vnode.dom, tabObject);
    },

    /**
     * Called when vnode might be updated
     * @param {vnode} vnode
     */
    onupdate(vnode) {
      // JSROOT setup
      redrawOnDataUpdate(model, vnode.dom, tabObject);
      resizeOnSizeUpdate(model, vnode.dom, tabObject);
    },

    /**
     * Called when vnode is removed from DOM tree
     * @param {vnode} vnode
     */
    onremove(vnode) {
      // tell model we don't need those data anymore and free memory if needed
      model.object.removeObjectByName(tabObject.name);

      // Remove JSROOT binding to avoid memory leak
      if (JSROOT.cleanup) {
        // cleanup might not be loaded yet
        JSROOT.cleanup(vnode.dom);
      }

      // stop listening for window size change
      window.removeEventListener('resize', vnode.dom.onresize);
    }
  };

  let content = null;
  const objectRemoteData = model.object.objects[tabObject.name];
  if (!objectRemoteData || objectRemoteData.isLoading()) {
    // not asked yet or loading
    content = h('.absolute-fill.flex-column.items-center.justify-center', [
      h('.animate-slow-appearance', 'Loading')
    ]);
  } else if (objectRemoteData.isFailure()) {
    content = h('.absolute-fill.flex-column.items-center.justify-center', [
      h('.p4.f6', objectRemoteData.payload),
    ]);
  } else {
    if (model.object.isObjectChecker(objectRemoteData.payload)) {
      return checkersPanel(objectRemoteData.payload, location);
    }
  }
  // on success, JSROOT will erase all DOM inside div and put its own
  return h('.relative.jsroot-container', attributes, content);
}

/**
 * Vnode update hook
 * Apply a JSROOT resize when view goes from one size state to another
 * State is stored DOM dataset of element
 * @param {Object} model
 * @param {Object} dom - the div containing jsroot plot
 * @param {Object} tabObject - tabObject to be redrawn inside dom
 */
function resizeOnSizeUpdate(model, dom, tabObject) {
  const resizeHash = fingerprintResize(tabObject);

  if (dom.dataset.fingerprintResize !== resizeHash) {
    dom.onresize();
    dom.dataset.fingerprintResize = resizeHash;
  }
}

/**
 * Vnode update hook.
 * Apply a JSROOT redraw when view goes from one data state to another
 * State is stored DOM dataset of element
 * @param {Object} model
 * @param {Object} dom - the div containing jsroot plot
 * @param {Object} tabObject - tabObject to be redrawn inside dom
 */
function redrawOnDataUpdate(model, dom, tabObject) {
  const objectRemoteData = model.object.objects[tabObject.name];

  const redrawHash = fingerprintRedraw(model, tabObject);
  const cleanRedrawHash = fingerprintCleanRedraw(model, tabObject);

  const shouldRedraw = dom.dataset.fingerprintRedraw !== redrawHash;
  const shouldCleanRedraw = dom.dataset.fingerprintCleanRedraw !== cleanRedrawHash;

  if (
    objectRemoteData &&
    objectRemoteData.isSuccess() &&
    !model.object.isObjectChecker(objectRemoteData.payload) &&
    (shouldRedraw || shouldCleanRedraw)
  ) {
    setTimeout(() => {
      if (JSROOT.cleanup) {
        // Remove previous JSROOT content before draw to do a real redraw.
        // Official redraw will keep options whenever they changed, we don't want this.
        // (cleanup might not be loaded yet)
        JSROOT.cleanup(dom);
      }

      if (objectRemoteData.payload._typename === 'TGraph' &&
        (objectRemoteData.payload.fOption === '' || objectRemoteData.payload.fOption === undefined)) {
        objectRemoteData.payload.fOption = 'alp';
      }

      let drawingOptions = model.object.generateDrawingOptions(tabObject, objectRemoteData);
      drawingOptions = drawingOptions.join(';');
      drawingOptions += ';stat';
      if (objectRemoteData.payload._typename !== 'TGraph') {
        // Use user's defined options and add undocumented option "f" allowing color changing on redraw (color is fixed without it)
        drawingOptions += ';f';
      }

      JSROOT.redraw(dom, objectRemoteData.payload, drawingOptions, (painter) => {
        if (painter === null) {
          // jsroot failed to paint it
          model.object.invalidObject(tabObject.name);
        }
      });
    }, 0);

    dom.dataset.fingerprintRedraw = redrawHash;
    dom.dataset.fingerprintCleanRedraw = cleanRedrawHash;
  }
}

/**
 * Generates a replacement fingerprint.
 * When it changes, element should be replaced
 * - tabObject.id (associated to .name) is dependency of oncreate and onremove to load/unload
 * @param {Object} tabObject
 * @return {vnode}
 */
function fingerprintReplacement(tabObject) {
  return `${tabObject.id}`;
}

/**
 * Generates a resize fingerprint.
 * When it changes, JSROOT should resize canvas
 * - tabObject.w and tabObject.h change size
 * @param {Object} tabObject
 * @return {vnode}
 */
function fingerprintResize(tabObject) {
  return `${tabObject.w}:${tabObject.h}`;
}

/**
 * Generates a redraw fingerprint.
 * When it changes, JSROOT should redraw canvas
 * - object data could be replaced on data refresh
 * - tabObject.options change requires redraw
 * @param {Object} model
 * @param {Object} tabObject
 * @return {string}
 */
function fingerprintRedraw(model, tabObject) {
  const drawData = model.object.objects[tabObject.name];
  const dataPointerId = drawData ? pointerId(drawData) : null;
  return `${dataPointerId}`;
}

/**
 * Generates a clean redraw fingerprint.
 * When it changes, JSROOT should clean and redraw canvas
 * - tabObject.options change requires clean-redraw, not just redraw
 * @param {Object} model
 * @param {Object} tabObject
 * @return {string}
 */
function fingerprintCleanRedraw(model, tabObject) {
  const drawOptions = tabObject.options.join(';');
  const ignoreDefaults = tabObject.ignoreDefaults ? true : false;
  return `${drawOptions},${ignoreDefaults}`;
}
