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
 * or submit itself to any jurisdiction.p
 */

import { triggerDownload } from './utils.js';
import { generateDrawingOptionString } from '../../library/qcObject/utils.js';

/* global JSROOT */

/**
 * Map of allowed svg file extensions to MIME types
 * @type {Map<string, string>}
 */
const SUPPORTED_SVG_FILE_TYPES = new Map([['svg', 'image/svg+xml']]);

/**
 * Map of allowed image file extensions to MIME types
 * @type {Map<string, string>}
 */
const SUPPORTED_IMAGE_FILE_TYPES = new Map([
  ['png', 'file/png'],
  ['jpg', 'file/jpeg'],
  ['jpeg', 'file/jpeg'],
  ['webp', 'file/webp'],
]);

/**
 * Creates a detached DOM container and draws a JSROOT RootObject into it.
 * @param {RootObject} root - The JSROOT RootObject to render.
 * @param {string[]} [drawingOptions=[]] - Optional JSROOT drawing options.
 * @returns {Promise<SVGElement>} - The drawn SVG element.
 */
const renderRootObjectToSVG = async (root, drawingOptions = []) => {
  const svgString = await JSROOT.makeSVG({
    object: root,
    option: generateDrawingOptionString(root, drawingOptions),
  });
  if (!svgString) {
    throw new Error('Failed to generate SVG');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!(svg instanceof SVGElement)) {
    throw new Error('Failed to parse SVG');
  }

  // Ensure proper scaling
  if (!svg.viewBox) {
    const width = svg.clientWidth || svg.getBoundingClientRect().width;
    const height = svg.clientHeight || svg.getBoundingClientRect().height;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  return svg;
};

/**
 * Serializes an SVG element to a Blob and triggers download.
 * @param {SVGElement} svg - The SVG element to download.
 * @param {string} filename - The filename for the downloaded file.
 */
const downloadSVG = (svg, filename) => {
  const filetype = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
  const mime = SUPPORTED_SVG_FILE_TYPES.get(filetype);
  if (!mime) {
    throw new Error('File type is not supported');
  }

  const svgString = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgString], { type: mime });
  const url = URL.createObjectURL(blob);
  try {
    triggerDownload(url, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
};

/**
 * Rasterize an SVG element to a PNG and triggers download.
 * @param {SVGElement} svg - The SVG element to rasterize.
 * @param {string} filename - The filename for the downloaded PNG.
 */
const downloadSVGAsImage = (svg, filename) => {
  const filetype = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
  const mime = SUPPORTED_IMAGE_FILE_TYPES.get(filetype);
  if (!mime) {
    throw new Error('Image file type is not supported');
  }

  const svgString = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const image = new Image();
  const [, , viewBoxWidth, viewBoxHeight] = svg.getAttribute('viewBox').split(' ').map(Number);

  canvas.width = image.width = viewBoxWidth;
  canvas.height = image.height = viewBoxHeight;

  image.onload = () => {
    context.drawImage(image, 0, 0, image.width, image.height);
    triggerDownload(canvas.toDataURL(mime), filename);
    image.src = ''; // free memory
  };
  image.src = `data:image/svg+xml,${encodeURIComponent(svgString)}`;
};

/**
 * Generates an SVG representation of a JSROOT RootObject and triggers download.
 * @param {string} filename - The name of the file to download.
 * @param {RootObject} root - The JSROOT RootObject to render.
 * @param {string[]} [drawingOptions=[]] - Optional array of JSROOT drawing options.
 */
export const downloadRootObjectAsSVG = async (filename, root, drawingOptions = []) => {
  const svg = await renderRootObjectToSVG(root, drawingOptions);
  downloadSVG(svg, filename);
};

/**
 * Generates a rasterized image of a JSROOT RootObject and triggers download.
 * @param {string} filename - The name of the file to download.
 * @param {RootObject} root - The JSROOT RootObject to render.
 * @param {string[]} [drawingOptions=[]] - Optional array of JSROOT drawing options.
 */
export const downloadRootObjectAsImage = async (filename, root, drawingOptions = []) => {
  const svg = await renderRootObjectToSVG(root, drawingOptions);
  downloadSVGAsImage(svg, filename);
};
