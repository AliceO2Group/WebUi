import './mithril.js/mithril.js'

/**
 * Register a callback to be called only one time at browser render time and only if the trigger was called before. Used to push new renderings efficitly.
 * @param {function} fn - The callback to be registered
 * @return {function} The trigger to be called
 */

function frameDebouncer(fn) {
  let requestFrame;
  return function() {
    const args = arguments;
    if (requestFrame) {
      cancelAnimationFrame(requestFrame);
    }
    requestFrame = requestAnimationFrame(function() {
      fn.apply(null, args);
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
  m.render(element, vnode);
}

/**
 * Hyperscript function to represente a DOM element and produce a vnode compatible with a patch function.
 * @param {String} selector - Tag name
 * @param {Object} attributes - (optional) className, class, onclick, href, ...
 * @param {Array<Vnode>|String|Number|Boolean} children - Children inside this tag
 * @return {Vnode} the Vnode representation
 */
function h() {
  // encapsulate mithril engine so we can change if needed
  // TODO: the API should be simplified of lifecycle methods and not depend on mithril
  return m.apply(null, arguments);
}

/**
 * Bind together a model and a view to render both on a DOM element.
 * @param {Element} element - The DOM element
 * @param {Function} view - The functional view which produces a vnode tree
 * @param {Observable} model - The model containing the state
 */
function mount(element, view, model) {
  const smartRender = frameDebouncer((model) => {
    console.time('render');
    render(element, view(model));
    console.timeEnd('render');
  });

  if (model.observe) {
    model.observe(smartRender); // redraw on changes
  }
  smartRender(model); // first draw
}

export { h, render, frameDebouncer, mount }
