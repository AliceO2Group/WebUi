/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

/* global window */

/**
 * Template engine functions using vnode and DOM diff algo
 * @module renderer
 */

// mithril function 'm' will be injected into window
// it is used by renderer as an abstracted engine
import '../lib/mithril.js';

if (!window.m) {
  throw new Error('mithril must be loaded into window');
}
if (!window.requestAnimationFrame) {
  throw new Error('renderer must be run inside a browser envirnnement');
}

/**
 * Register a callback to be called one time at browser render time if
 * the trigger was called before. Used to push new renderings efficitly.
 * @param {function} fn - The callback to be registered
 * @return {function} The trigger to be called
 */
function frameDebouncer(fn) {
  let requestFrame;
  return function(...args) {
    if (requestFrame) {
      window.cancelAnimationFrame(requestFrame);
    }
    requestFrame = window.requestAnimationFrame(function() {
      fn(...args);
    });
  };
}

/**
 * Renders a vnode tree inside the dom element.
 * @param {Element} element - the dom element
 * @param {Vnode} vnode - the vnode tree
 * @example
 * import {h, render} from '/js/src/index.js';
 * let virtualNode = h('h1.title', 'World');
 * render(document.body, virtualNode);
 */
function render(element, vnode) {
  // encapsulate mithril engine so we can change if needed
  window.m.render(element, vnode);
}

/**
 * This callback type is a Hook.
 * Hooks are lifecycle methods of vnodes.
 * They are only called as a side effect of template engine (`render` or `mount`).
 * Properties of vnode argument must not be used, except `dom`.
 * It's very useful to connect with another template engine like a chart lib or a canvas.
 * Don't forget to remove any link to DOM element when `onremove` is called to avoid memory leaks.
 *
 * @callback Hook
 * @param {Object} vnode
 * @param {DOMElement} vnode.dom - DOM element you can access
 */

/**
 * Hyperscript function to represente a DOM element
 * it produces a vnode usable by render function.
 *
 * @param {String} selector - Tag name (div, p, h1...) and optional classes as CSS selector (.foo.bar.baz), empty string =~ 'div'
 * @param {Object} attributes - (optional) Properties and attributes of DOM elements and hooks (see description). Here is a non-exhaustive list of common uses:
 * @param {string} attributes.className - Additional class names
 * @param {function} attributes.onclick - On mouse click [DOM handler onclick](https://developer.mozilla.org/fr/docs/Web/API/GlobalEventHandlers/onclick)
 * @param {function} attributes.oninput - On content typed inside input tag [DOM handler oninput](https://developer.mozilla.org/fr/docs/Web/API/GlobalEventHandlers/oninput)
 * @param {string|Object} attributes.style - `style: "background:red;"` or `style: {background: "red"}`
 * @param {string} attributes.href - Destination for links [DOM href property](https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/href)
 * @param {string} attributes.placeholder - Placeholder for inputs [DOM input, all properties](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input)
 * @param {string} attributes.value - Value for inputs [DOM input, all properties](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input)
 * @param {Hook} attributes.oncreate - Hook called after a DOM element is created and attached to the document
 * @param {Hook} attributes.onupdate - Hook is called after each render, while DOM element is attached to the document
 * @param {Hook} attributes.onremove - Hook is called before a DOM element is removed from the document
 * @param {Array.<Vnode|string>|string} children - Children inside this tag
 * @return {Vnode} the Vnode representation
 * @example <caption>Simple tag declaration</caption>
 * import {h, render} from '/js/src/index.js';
 * const virtualNode1 = h('h1.text-center', 'World');
 * render(document.body, virtualNode1);
 * @example <caption>Usage of click and hooks</caption>
 * import {h, render} from '/js/src/index.js';
 * const virtualNode1 = h('h1.text-center', 'World');
 * const virtualNode2 = h('h1.text-center', {className: 'primary'}, 'World');
 * const virtualNode3 = h('h1', {onclick: () => console.log('clicked')}, 'World');
 * const chart = h('div', {
 *   oncreate: (vnode) => chartlib.attachTo(vnode.dom),
 *   onremove: (vnode) => chartlib.detachFrom(vnode.dom)
 * });
 * const containerNode = h('div', [
 *   virtualNode1,
 *   virtualNode2,
 *   virtualNode3,
 *   chart
 * ]);
 * render(document.body, containerNode);
 */
function h(...args) {
  // encapsulate mithril engine so we can change if needed
  return window.m(...args);
}

/**
 * Bind together a model and a view to render both on a DOM element.
 * When the model change and is an `Observable`, view refresh by itself (unlike `render()`)
 * @param {Element} element - The DOM element
 * @param {Function} view - The functional view which produces a vnode tree
 * @param {Observable} model - The model containing the state
 * @param {boolean} debug - Facultative. Shows the rendering time each time
 * @example
 * import {h, mount, Observable} from '/js/src/index.js';
 * const model = new Observable();
 * const view = (model) => h('h1.title', `hello ${model.name}`);
 * mount(document.body, view, model);
 * model.name = 'Joueur du Grenier';
 * model.notify();
 */
function mount(element, view, model, debug) {
  const smartRender = frameDebouncer((model) => {
    if (debug) {
      // eslint-disable-next-line no-console
      console.time('render');
    }
    try {
      render(element, view(model));
    } finally {
      if (debug) {
        // eslint-disable-next-line no-console
        console.timeEnd('render');
      }
    }
  });

  if (model.observe) {
    model.observe(smartRender); // redraw on changes
  }
  render(element, view(model)); // first draw
}

export {h, render, frameDebouncer, mount};
