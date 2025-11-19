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

/* global JSROOT */

import { h, iconWarning } from '/js/src/index.js';
import { keyedTimerDebouncer, pointerId } from '../common/utils.js';
import { isObjectOfTypeChecker } from './../library/qcObject/utils.js';
import checkersPanel from './../common/object/checkersPanel.js';
import { generateDrawingOptionList } from '../../library/qcObject/utils.js';

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
 * @param {object} model - root model object
 * @param {TabObject|string} tabObject - the tabObject to draw, can be the name of object
 * @param {object} options - optional options of presentation
 * @returns {vdom} output virtual-dom, a single div with JSROOT attached to it
 */
export function draw(model, tabObject, options) {
  const defaultOptions = {
    width: '100%', // CSS size
    height: '100%', // CSS size
    className: '', // Any CSS class
  };

  options = { ...defaultOptions, ...options };

  if (typeof tabObject === 'string') {
    tabObject = {
      id: tabObject,
      name: tabObject,
      ignoreDefaults: false,
      options: options.stat ? ['stat'] : [],
      x: 0,
      y: 0,
      h: 0,
      w: 0,
    };
  }
  const attributes = {
    'data-fingerprint-key': fingerprintReplacement(tabObject), // Just for humans in inspector
    key: fingerprintReplacement(tabObject), // Completely re-create this div if the chart is not the same at all
    class: options.className,
    style: {
      height: options.height,
      width: options.width,
    },

    /**
     * Called when vnode has been created as a DOM element
     * @param {vnode} vnode - virtual node to be used
     * @returns {undefined}
     */
    oncreate(vnode) {
      // Ask model to load data to be shown

      // Setup resize function
      vnode.dom.onresize = () => {
        resizeOnSizeUpdate(model.object, vnode.dom, tabObject);
      };

      // Resize on window size change
      window.addEventListener('resize', vnode.dom.onresize);

      // JSROOT setup
      redrawOnDataUpdate(model, vnode.dom, tabObject);
      resizeOnSizeUpdate(model.object, vnode.dom, tabObject);
    },

    /**
     * Called when vnode might be updated
     * @param {vnode} vnode - virtual node to be used
     * @returns {undefined}
     */
    onupdate(vnode) {
      // JSROOT setup
      redrawOnDataUpdate(model, vnode.dom, tabObject);
      resizeOnSizeUpdate(model.object, vnode.dom, tabObject);
    },

    /**
     * Called when vnode is removed from DOM tree
     * @param {vnode} vnode - virtual node to be used
     * @returns {undefined}
     */
    onremove(vnode) {
      // Remove JSROOT binding to avoid memory leak
      if (JSROOT.cleanup) {
        // Cleanup might not be loaded yet
        JSROOT.cleanup(vnode.dom);
      }

      // Stop listening for window size change
      window.removeEventListener('resize', vnode.dom.onresize);
    },
  };

  const content = null;
  const objectRemoteData = model.object.objects[tabObject.name];
  if (!objectRemoteData || objectRemoteData.isLoading()) {
    // Not asked yet or loading
    return h('.flex-column.items-center.justify-center', [h('.animate-slow-appearance', 'Loading')]);
  } else if (objectRemoteData.isFailure()) {
    return h('.error-box.danger.flex-column.justify-center.f6.text-center', {}, [
      h('span.error-icon', { title: 'Error' }, iconWarning()),
      h('span', objectRemoteData.payload),
    ]);
  } else {
    if (isObjectOfTypeChecker(objectRemoteData.payload.qcObject.root)) {
      return checkersPanel(objectRemoteData.payload.qcObject.root);
    }
  }
  // On success, JSROOT will erase all DOM inside div and put its own
  return h('.relative.jsroot-container', attributes, content);
}

/**
 * Debounced resize handler that redraws a graph upon size update only after:
 * - Rapid resize events have stopped (200 ms debounce)
 * - The JSROOT element's size has fully stabilized (50 ms interval polling)
 *
 * *Why debounce:*
 * Resize events can fire rapidly (window resize, panel changes, responsive layout).
 * Redrawing on every event is expensive and unnecessary.
 * Debouncing ensures only the final resize state triggers a redraw, preventing
 * redundant work and improving performance.
 *
 * *Why interval:*
 * Even after resize events stop firing, the element's width/height may still change
 * due to transitions, animations, flexbox reflow, or delayed CSS effects.
 * The 50 ms interval checks for consecutive identical size fingerprints to confirm that
 * the element has fully settled before allowing a redraw.
 * This prevents flicker and avoids redrawing into a layout that is still moving.
 *
 * *Note:*
 * The debouncer is keyed by the JSROOT element itself, allowing multiple
 * independent JSROOT graphs to debounce and update separately.
 * @param {Model} model - root model of the application
 * @param {HTMLElement} dom - the element containing jsroot plot
 * @param {TabObject} tabObject - tabObject to be redrawn inside dom
 * @returns {undefined}
 */
const resizeOnSizeUpdate = keyedTimerDebouncer(
  (_, dom) => dom,
  (objectModel, dom, tabObject) => {
    let previousFingerprint = dom.dataset.fingerprintResize;

    const intervalId = setInterval(() => {
      try {
        const currentFingerprint = fingerprintResize(dom.clientWidth, dom.clientHeight);

        // Still changing: update the fingerprint and wait for the next interval
        if (previousFingerprint !== currentFingerprint) {
          previousFingerprint = currentFingerprint;
          return;
        }

        // Size stable across intervals (safe to redraw)
        if (dom.dataset.fingerprintResize !== currentFingerprint) {
          dom.dataset.fingerprintResize = currentFingerprint;
          const objectRemoteData = objectModel.objects[tabObject.name];
          const qcObject = objectRemoteData.payload.qcObject.root;
          let drawingOptions = objectModel.generateDrawingOptions(tabObject, objectRemoteData);
          drawingOptions = generateDrawingOptionList(qcObject, drawingOptions);
          JSROOT.redraw(dom, qcObject, drawingOptions);
        }

        clearInterval(intervalId);
        // eslint-disable-next-line no-unused-vars
      } catch (_) {
        // stop monitoring on error
        clearInterval(intervalId);
      }
    }, 50);
  },
  200,
);

/**
 * Vnode update hook.
 * Apply a JSROOT redraw when view goes from one data state to another
 * State is stored DOM dataset of element
 * @param {Model} model - root model of the application
 * @param {HTMLElement} dom - the div containing jsroot plot
 * @param {TabObject} tabObject - tabObject to be redrawn inside dom
 * @returns {undefined}
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
    !isObjectOfTypeChecker(objectRemoteData.payload.qcObject.root) &&
    (shouldRedraw || shouldCleanRedraw)
  ) {
    const qcObject = objectRemoteData.payload.qcObject.root;
    setTimeout(() => {
      if (JSROOT.cleanup) {
        /*
         * Remove previous JSROOT content before draw to do a real redraw.
         * Official redraw will keep options whenever they changed, we don't want this.
         * (cleanup might not be loaded yet)
         */
        JSROOT.cleanup(dom);
      }
      let drawingOptions = model.object.generateDrawingOptions(tabObject, objectRemoteData);
      drawingOptions = generateDrawingOptionList(qcObject, drawingOptions);

      JSROOT.draw(dom, qcObject, drawingOptions.join(';')).then((painter) => {
        if (painter === null) {
          // Jsroot failed to paint it
          model.object.invalidObject(tabObject.name);
        }
      }).catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error);
        model.object.invalidObject(tabObject.name);
      });
    }, 0);

    dom.dataset.fingerprintRedraw = redrawHash;
    dom.dataset.fingerprintCleanRedraw = cleanRedrawHash;
  } else if (objectRemoteData && objectRemoteData.isFailure()) {
    JSROOT.cleanup(dom);

    /*
     * Model.object.invalidObject(tabObject.name);
     * model.notify();
     */
  }
}

/**
 * Generates a replacement fingerprint.
 * When it changes, element should be replaced
 * - tabObject.id (associated to .name) is dependency of oncreate and onremove to load/unload
 * @param {TabObject} tabObject - tab dto representation
 * @returns {vnode} - virtual node
 */
function fingerprintReplacement(tabObject) {
  return `${tabObject.id}`;
}

/**
 * Generates a resize fingerprint.
 * When it changes, JSROOT should resize canvas
 * @param {number} width - the width of the element
 * @param {number} height - the height of the element
 * @returns {string} - the fingerprint
 */
function fingerprintResize(width, height) {
  return `${width}:${height}`;
}

/**
 * Generates a redraw fingerprint.
 * When it changes, JSROOT should redraw canvas
 * - object data could be replaced on data refresh
 * - tabObject.options change requires redraw
 * @param {Model} model - root model of the application
 * @param {TabObject} tabObject - tab dto representation
 * @returns {string} - id of the redraw
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
 * @param {Model} model - root model of the application
 * @param {TabObject} tabObject - tab dto representation
 * @returns {string} - id of the redraw
 */
function fingerprintCleanRedraw(model, tabObject) {
  const drawOptions = tabObject.options.join(';');
  const ignoreDefaults = tabObject.ignoreDefaults ? true : false;
  return `${drawOptions},${ignoreDefaults}`;
}
