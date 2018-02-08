/* global window */

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
 */
function render(element, vnode) {
  // encapsulate mithril engine so we can change if needed
  window.m.render(element, vnode);
}

/**
 * Hyperscript function to represente a DOM element
 * it produces a vnode usable by render function.
 * @param {String} selector - Tag name
 * @param {Object} attributes - (optional) className, class, onclick, href, ...
 * @param {Array<Vnode>|String|Number|Boolean} children - Children inside this tag
 * @return {Vnode} the Vnode representation
 */
function h(...args) {
  // encapsulate mithril engine so we can change if needed
  // TODO: the API should be simplified of lifecycle methods and not depend on mithril
  return window.m(...args);
}

/**
 * Bind together a model and a view to render both on a DOM element.
 * @param {Element} element - The DOM element
 * @param {Function} view - The functional view which produces a vnode tree
 * @param {Observable} model - The model containing the state
 * @param {boolean} debug - Facultative. Shows the rendering time each time
 */
function mount(element, view, model, debug) {
  const smartRender = frameDebouncer((model) => {
    if (debug) {
      // eslint-disable-next-line no-console
      console.time('render');
    }
    render(element, view(model));
    if (debug) {
      // eslint-disable-next-line no-console
      console.timeEnd('render');
    }
  });

  if (model.observe) {
    model.observe(smartRender); // redraw on changes
  }
  render(element, view(model)); // first draw
}

export {h, render, frameDebouncer, mount};
