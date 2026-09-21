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

import { h } from '/js/src/index.js';
import { generateDrawingOptionString, isObjectOfTypeChecker } from './../../../library/qcObject/utils.js';
import checkersPanel from './checkersPanel.js';
import { keyedTimerDebouncer, pointerId } from '../utils.js';
import { failureToDrawPanel } from './failureToDrawPanel.js';

/**
 * Renders a QCObject as a virtual DOM node using JSROOT.
 * Depending on the state of the requested object, this function handles:
 * - `NotAsked`: returns `null`.
 * - `Loading`: returns a loading placeholder.
 * - `Failure`: returns an error box with the error message.
 * - `Success`: draws the object using `drawObject`.
 * @param {RemoteData} remoteData - the RemoteData object containing {qcObject, info, timestamps}
 * @param {object} options - optional options of presentation
 * @param {string[]} drawingOptions - optional drawing options to be used
 * @param {(Error) => void} failFn - optional function to execute upon drawing failure
 * @returns {vnode} output virtual-dom, a single div with JSROOT attached to it
 */
export const draw = (remoteData = {}, options = {}, drawingOptions = [], failFn = () => {}) =>
  remoteData?.match({
    NotAsked: () => null,
    Loading: () => h('.flex-column.items-center.justify-center', [h('.animate-slow-appearance', 'Loading')]),
    Failure: (error) => failureToDrawPanel(error),
    Success: (data) => drawObject(data, options, drawingOptions, failFn),
  });

/**
 * Draws a QC Object depending on its type:
 * - uses JSROOT for standard ROOT objects in which JSROOT is then used to insert an SVG with the respective plot
 * - builds a checkers panel for QC unique checkers
 * @param {JSON} object - {qcObject, info, timestamps}
 * @param {object} options - optional options of presentation
 * @param {string[]} drawingOptions - optional drawing options to be used
 * @param {(Error) => void} failFn - optional function to execute upon drawing failure
 * @returns {vnode} output virtual-dom, a single div with JSROOT attached to it
 */
export const drawObject = (object, options = {}, drawingOptions = [], failFn = () => {}) => {
  const { qcObject, etag } = object;
  const { root, rootError } = qcObject;
  if (isObjectOfTypeChecker(root)) {
    return checkersPanel(root);
  } else if (rootError) {
    return failureToDrawPanel(rootError);
  }

  drawingOptions = Array.from(new Set(drawingOptions));
  const defaultOptions = {
    width: '100%', // CSS size
    height: '100%', // CSS size
    className: '', // Any CSS class
  };
  options = { ...defaultOptions, ...options };

  const attributes = {
    key: etag, // Completely re-create this div if the chart is not the same at all
    id: etag,
    class: options.className,
    style: {
      height: options.height,
      width: options.width,
    },
    oncreate: (vnode) => {
      // Setup resize function
      vnode.dom.onresize = () => {
        redrawOnSizeUpdate(vnode.dom, root, drawingOptions, failFn);
      };

      // Resize on window size change
      window.addEventListener('resize', vnode.dom.onresize);

      drawOnCreate(vnode.dom, root, drawingOptions, failFn);
    },
    onupdate: (vnode) => {
      const isRedrawn = redrawOnDataUpdate(vnode.dom, root, drawingOptions);
      if (!isRedrawn) {
        redrawOnSizeUpdate(vnode.dom, root, drawingOptions, failFn);
      }
    },
    onremove: (vnode) => {
      // Remove JSROOT binding to avoid memory leak
      if (JSROOT.cleanup) {
        JSROOT.cleanup(vnode.dom);
      }

      // Stop listening for window size change
      window.removeEventListener('resize', vnode.dom.onresize);
    },
  };

  // On success, JSROOT will erase all DOM inside div and put its own
  return h('.relative.jsroot-container', attributes);
};

/**
 * Inserts SVG into div element by using JSROOT.draw method
 * Applies specific drawing options to ensure correct plotting
 * @param {HTMLElement} dom - the div containing jsroot plot
 * @param {object} root - root object in JSON representation
 * @param {string[]} drawingOptions - list of options to be used for drawing object
 * @param {(Error) => void} failFn - function to execute upon drawing failure
 * @throws {EvalError} If CSP disallows 'unsafe-eval'.
 * This is typically called when the drawing is incomplete or malformed.
 * @returns {undefined}
 */
const drawOnCreate = async (dom, root, drawingOptions, failFn) => {
  const finalDrawingOptions = generateDrawingOptionString(root, drawingOptions);
  JSROOT.draw(dom, root, finalDrawingOptions).then((painter) => {
    if (painter === null) {
      if (typeof failFn === 'function') {
        failFn(new Error('null painter in JSROOT'));
      }
    }
  }).catch((error) => {
    if (typeof failFn === 'function') {
      failFn(error);
    }
  });
  dom.dataset.fingerprintRedraw = fingerprintResize(dom.clientWidth, dom.clientHeight);
  dom.dataset.fingerprintData = fingerprintData(root, drawingOptions);
};

/**
 * Debounced resize handler for JSROOT graphs.
 *
 * Behavior:
 * - Resizes are debounced by 200 ms to avoid excessive redraws during rapid events.
 * - After debounce, a 50 ms interval checks whether the element's size has fully stabilized
 *   (important because CSS transitions, flexbox, and layout effects can continue to adjust size
 *   after resize events stop).
 * - Only once the size is stable is the graph redrawn.
 *
 * Keying:
 * - Debouncing is keyed by the DOM element, allowing multiple graphs to update independently.
 *
 * onFirstCall logic:
 * - Runs immediately the first time a specific DOM element triggers this debouncer.
 * - Ensures an instant initial redraw without waiting for the debounce delay or stabilization interval.
 * - Subsequent resizes for the same element follow the normal debounce + stabilization flow.
 * @param {Model} model - Root model of the application
 * @param {HTMLElement} dom - Element containing the JSROOT plot
 * @param {TabObject} tabObject - Object describing the graph to redraw inside `dom`
 * @param {(Error) => void} failFn - Function to execute upon drawing failure
 * @returns {undefined}
 */
const redrawOnSizeUpdate = keyedTimerDebouncer(
  (_, dom) => dom,
  (dom, root, drawingOptions, failFn) => {
    let previousFingerprint = dom.dataset.fingerprintResize;

    const intervalId = setInterval(() => {
      try {
        const currentFingerprint = fingerprintResize(dom.clientWidth, dom.clientHeight);

        // Check for playing animation/transition
        if (previousFingerprint !== currentFingerprint) {
          previousFingerprint = currentFingerprint;
          return;
        }

        // Size stable across intervals (safe to redraw)
        if (dom.dataset.fingerprintResize !== currentFingerprint) {
          redraw(dom, root, drawingOptions, failFn);
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
  (dom, root, drawingOptions, failFn) => {
    const resizeFingerprint = fingerprintResize(dom.clientWidth, dom.clientHeight);
    if (dom.dataset.fingerprintResize !== resizeFingerprint) {
      redraw(dom, root, drawingOptions, failFn);
    }
  },
);

/**
 * Vnode update hook.
 * Apply a JSROOT redraw when view goes from one data state to another
 * State is stored DOM dataset of element
 * @param {HTMLElement} dom - Target element containing the JSROOT graph.
 * @param {object} root - JSROOT-compatible data object to be rendered.
 * @param {string[]} drawingOptions - Initial or user-provided drawing options.
 * @param {(Error) => void} failFn - Function to execute upon drawing failure
 * @returns {boolean} whether the JSROOT plot was redrawn
 */
const redrawOnDataUpdate = (dom, root, drawingOptions, failFn) => {
  const dataFingerprint = fingerprintData(root, drawingOptions);
  if (dom.dataset.fingerprintData !== dataFingerprint) {
    redraw(dom, root, drawingOptions, failFn);
    return true;
  }
  return false;
};

/**
 * Performs a JSROOT redraw using the final resolved drawing options.
 * @param {HTMLElement} dom - Target element containing the JSROOT graph.
 * @param {object} root - JSROOT-compatible data object to be rendered.
 * @param {string[]} drawingOptions - Initial or user-provided drawing options.
 * @param {(Error) => void} failFn - Function to execute upon drawing failure
 * @returns {undefined}
 */
const redraw = (dom, root, drawingOptions, failFn) => {
  // A bug exists in JSROOT where the cursor gets stuck on `wait` when redrawing multiple objects simultaneously.
  // We save the current cursor state here and revert back to it after redrawing is complete.
  const currentCursor = document.body.style.cursor;
  const finalDrawingOptions = generateDrawingOptionString(root, drawingOptions);
  try {
    JSROOT.redraw(dom, root, finalDrawingOptions);
  } catch (error) {
    if (typeof failFn === 'function') {
      failFn(error);
    }
  }
  document.body.style.cursor = currentCursor;
};

/**
 * Generates a resize fingerprint.
 * When it changes, JSROOT should resize canvas
 * @param {number} width - the width of the element
 * @param {number} height - the height of the element
 * @returns {string} - the resize fingerprint
 */
const fingerprintResize = (width, height) =>
  `${width}:${height}`;

/**
 * Generates a data fingerprint.
 * When it changes, JSROOT should redraw canvas
 * - object data could be replaced on data refresh
 * - tabObject.options change requires redraw
 * @param {object} root - root object in JSON representation
 * @param {string[]} drawingOptions - list of options to be used for drawing object
 * @returns {string} - id of the redraw
 */
const fingerprintData = (root, drawingOptions) => {
  const finalDrawingOptions = generateDrawingOptionString(root, drawingOptions);
  const rootPointerId = pointerId(root);
  return `${rootPointerId}:${finalDrawingOptions}`;
};
