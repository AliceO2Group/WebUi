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
import { generateDrawingOptionList, isObjectOfTypeChecker } from './../../../library/qcObject/utils.js';
import checkersPanel from './checkersPanel.js';
import { keyedTimerDebouncer } from '../utils.js';

/**
 * Draws a QC Object depending on its type:
 * * uses JSROOT for standard ROOT objects
 * * builds a checkers panel for QC unique checkers
 * @param {QCObjectDto} object - JSON representation of a QC object
 * @param {object} [options] - optional options of presentation
 * @param {object} [drawingOptions] - optional drawing options to be used
 * @returns {vnode} output virtual-dom, a single div with JSROOT attached to it
 */
export const draw = (object, options = {}, drawingOptions = []) => isObjectOfTypeChecker(object.qcObject.root)
  ? checkersPanel(object.qcObject.root)
  : rootPlotPanel(object, options, drawingOptions);

/**
 * Builds a div element in which JSROOT is then used to insert an SVG with the respective plot
 * @param {QCObjectDto} object - JSON representation of a QC object
 * @param {object} [options] - optional options of presentation
 * @param {object} [drawingOptions] - optional drawing options to be used
 * @returns {vnode} output virtual-dom, a single div with JSROOT attached to it
 */
const rootPlotPanel = (object, options, drawingOptions) => {
  drawingOptions = Array.from(new Set(drawingOptions));
  const { root } = object.qcObject;
  const defaultOptions = {
    width: '100%', // CSS size
    height: '100%', // CSS size
    className: '', // Any CSS class
  };
  options = { ...defaultOptions, ...options };

  const attributes = {
    key: root.name, // Completely re-create this div if the chart is not the same at all
    id: object.etag,
    class: options.className,
    style: {
      height: options.height,
      width: options.width,
    },
    oncreate: (vnode) => {
      // Setup resize function
      vnode.dom.onresize = () => {
        resizeOnSizeUpdate(vnode.dom, root, drawingOptions);
      };

      // Resize on window size change
      window.addEventListener('resize', vnode.dom.onresize);

      drawOnCreate(vnode.dom, root, drawingOptions);
    },
    onupdate: (vnode) => resizeOnSizeUpdate(vnode.dom, root, drawingOptions),
    onremove: (vnode) => {
      // Remove JSROOT binding to avoid memory leak
      if (JSROOT.cleanup) {
        JSROOT.cleanup(vnode.dom);
      }

      // Stop listening for window size change
      window.removeEventListener('resize', vnode.dom.onresize);
    },
  };

  return h('.relative.jsroot-container', attributes);
};

/**
 * Inserts SVG into div element by using JSROOT.draw method
 * Applies specific drawing options to ensure correct plotting
 * @param {HTMLElement} dom - the div containing jsroot plot
 * @param {object} root - root object in JSON representation
 * @param {Array<string>} drawingOptions - list of options to be used for drawing object
 * @returns {undefined}
 */
function drawOnCreate(dom, root, drawingOptions) {
  drawingOptions = generateDrawingOptionList(root, drawingOptions);
  JSROOT.draw(dom, root, drawingOptions.join(';')).then((painter) => {
    if (painter === null) {
      // eslint-disable-next-line no-console
      console.error('null painter in JSROOT');
    }
  }).catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
  });
  dom.dataset.fingerprintRedraw = fingerprintResize(dom.clientWidth, dom.clientHeight);
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
  (dom, root, drawingOptions) => {
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
          JSROOT.redraw(dom, root, drawingOptions.join(';'));
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
 * Generates a resize fingerprint.
 * When it changes, JSROOT should resize canvas
 * @param {number} width - the width of the element
 * @param {number} height - the height of the element
 * @returns {string} - the fingerprint
 */
function fingerprintResize(width, height) {
  return `${width}:${height}`;
}
