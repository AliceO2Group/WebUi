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

import {h} from './renderer.js';

/**
 * Displays time-series based chart of recent data
 * with a sliding window. Time scale (x) must be specified and
 * value scale (y) is automatic to fill height.
 * Value: {value:number, timestamp:number:ms}
 * @param {Object} userOptions - all options to draw the chart
 * @param {number} width - size of canvas
 * @param {number} height - size of canvas
 * @param {Array<Values>} series - timestamp in ms
 * @param {string} title - to be printed on corner bottom left
 * @param {number} timeWindow - ms/div for x axis, div is half height
 * @param {string} colorPrimary - color of curve
 * @param {string} colorSecondary - color of axis and labels
 * @param {string} background - color of background
 * @return {vnode} canvas element as a virtual node
 * @example
 * chartTimeSeries({
 *   series: [{value: Math.random(), timestamp: Date.now()}],
 *   title: 'Random',
 *   colorPrimary: 'blue',
 *   width: '800',
 *   width: '200',
 *   timeWindow: 1000,
 * })
 */
export function chartTimeSeries(userOptions) {
  const defaults = {
    width: 400,
    height: 200,
    series: [], // [{value:number, timestamp:number:ms}]
    background: 'white',
    colorPrimary: 'black',
    colorSecondary: 'gray',
    title: '',
    devicePixelRatio: window.devicePixelRatio, // default=1, retina=2, higher=3
    timeWindow: 1000, // how many ms to represent in the width available
  };
  const options = Object.assign({}, defaults, userOptions);

  // Canvas is 2x bigger than element, to handle high resolution (retina)
  return h('canvas', {
    width: options.width * options.devicePixelRatio,
    height: options.height * options.devicePixelRatio,
    style: {
      width: options.width + 'px',
      height: options.height + 'px',
    },
    oncreate: (vnode) => draw(vnode.dom, options),
    onupdate: (vnode) => draw(vnode.dom, options),
  });
}

/**
 * Draw chartTimeSeries to the specified dom element with options
 * @param {DOMElement} dom
 * @param {Object} options - See chartTimeSeries options
 */
function draw(dom, options) {
  const ctx = dom.getContext('2d');
  ctx.save(); // save default scale
  ctx.scale(options.devicePixelRatio, options.devicePixelRatio);
  ctx.clearRect(0, 0, options.width, options.height);
  ctx.beginPath();
  ctx.rect(0, 0, options.width, options.height);
  ctx.fillStyle = options.background;
  ctx.fill();

  const maxValue = maxOf(options.series);
  const minValue = minOf(options.series);

  const minY = minValue.toExponential(2);
  const maxY = maxValue.toExponential(2);
  const legendText = `minY=${minY}, maxY=${maxY}, ms/div=${options.timeWindow}ms`;

  drawLegend(ctx, options.title, legendText, 0, options.height - 16,
    options.width, options.height, options.colorSecondary);
  drawGrid(ctx, options.width, options.height - 16, options.colorSecondary);
  drawCurve(ctx, options.series, maxValue, minValue,
    options.width, options.height - 16, options.colorPrimary, options.timeWindow);

  ctx.restore(); // restore default scale
}

/**
 * Part of chartTimeSeries, draw the title and scaling
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} titleText - title at bottom left
 * @param {string} legendText - legend at bottom right
 * @param {number} left - position of legend
 * @param {number} top - position of legend
 * @param {number} width - width of legend
 * @param {number} height - height of legend
 * @param {string} color - color of texts
 */
function drawLegend(ctx, titleText, legendText, left, top, width, height, color) {
  ctx.font = '13px monospace';
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.textBaseline = 'top';

  ctx.textAlign = 'left';
  ctx.fillText(titleText, left, top);

  ctx.textAlign = 'right';
  ctx.fillText(legendText, width, top);
}

/**
 * Part of chartTimeSeries, draw the axis
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width - width of the available area
 * @param {number} height - height of the available area
 * @param {string} color - color of axis
 */
function drawGrid(ctx, width, height, color) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.setLineDash([5, 5]);

  // top
  ctx.moveTo(0, 1);
  ctx.lineTo(width, 1);
  ctx.stroke();

  // middle
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // bottom
  ctx.moveTo(0, height);
  ctx.lineTo(width, height);
  ctx.stroke();

  // verticals (to form squares)
  for (let x = width; x >= 0; x -= height / 2) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

/**
 * Part of chartTimeSeries, draw the curve
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} series - data
 * @param {number} max - max value of series
 * @param {number} min - min value of series
 * @param {number} width - width of the available area
 * @param {number} height - height of the available area
 * @param {string} color - color of curve
 * @param {number} timeWindow - ms
 */
function drawCurve(ctx, series, max, min, width, height, color, timeWindow) {
  if (series.length === 0) {
    // nothing to draw, exit now
    return;
  }

  // init path
  ctx.beginPath();
  ctx.strokeStyle = color;

  const diff = max - min || 1; // relative range of Y axis, div zero avoided with 1
  let firstPoint = true;
  series.sort(sortByTimestamp); // index 0 is older, higher is newer
  const divSize = height / 2; // pixels per division for X axis
  const numberOfDivs = width / divSize; // # of division on X axis for the space available

  const maxTimestamp = Date.now(); // maximum value on X axis (timestamp)
  const totalTimeWindow = numberOfDivs * timeWindow; // how much time represented on the plot (ms)
  const minTimestamp = maxTimestamp - totalTimeWindow; // minimum value on X axis (timestamp)

  // draw points starting from the most recent (right) to older (left)
  // until curbe overflow avaialble space or until there is no more points
  for (let pointIndex = series.length - 1; pointIndex >= 0; pointIndex--) {
    const point = series[pointIndex];
    if (!point) {
      throw new Error('chartTimeSeries: empty point in series');
    }

    let y = point.value;
    y = y - min; // position of minimal value centered on horizontal axis (bottom)
    y = y / diff * height; // scale min and max to fill height
    y = height - y; // reverse axis, negative on right, positive on left

    let x = point.timestamp;
    x = maxTimestamp - x; // position of max time centered on vertical axis
    x = x / totalTimeWindow * width; // scale timeWindow to fill width
    x = width - x; // reverse axis, negative on right, positive on left

    firstPoint ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    firstPoint = false;

    if (minTimestamp > point.timestamp) {
      break;
    }
  }
  ctx.stroke();
  ctx.closePath();
}

/**
 * Comparaison function to sort points by `timestamp` field
 * @param {Object} pointA - {value:number, timestamp:number:ms}
 * @param {Object} pointB - {value:number, timestamp:number:ms}
 * @return {number}
 */
const sortByTimestamp = (pointA, pointB) => pointA.timestamp - pointB.timestamp;

/**
 * Find the maximum '.value' of array of points
 * @param {Array.<Point>} points
 * @return {number}
 */
const maxOf = (points) => points.reduce(
  (max, point) => point.value > max ? point.value : max,
  -Infinity
);

/**
 * Find the minimum '.value' of array of points
 * @param {Array.<Point>} points
 * @return {number}
 */
const minOf = (points) => points.reduce(
  (min, point) => point.value < min ? point.value : min,
  +Infinity
);

