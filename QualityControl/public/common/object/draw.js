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

/**
 * Draws a QC Object depending on its type:
 * * uses JSROOT for standard ROOT objects
 * * builds a checkers panel for QC unique checkers
 *
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
    oncreate: (vnode) => drawOnCreate(vnode.dom, root, drawingOptions),
    onremove: (vnode) => {
      // Remove JSROOT binding to avoid memory leak
      if (JSROOT.cleanup) {
        JSROOT.cleanup(vnode.dom);
      }
    },
  };

  return h('.relative.jsroot-container', attributes);
};

/**
 * Inserts SVG into div element by using JSROOT.draw method
 * Applies specific drawing options to ensure correct plotting
 * @param {string} id - the div containing jsroot plot
 * @param {object} root - root object in JSON representation
 * @param {Array<string>} drawingOptions - list of options to be used for drawing object
 * @returns {undefined}
 */
function drawOnCreate(id, root, drawingOptions) {
  drawingOptions = generateDrawingOptionList(root, drawingOptions);
  JSROOT.draw(id, root, drawingOptions.join(';')).then((painter) => {
    if (painter === null) {
      // eslint-disable-next-line no-console
      console.error('null painter in JSROOT');
    }
  }).catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
  });
}
