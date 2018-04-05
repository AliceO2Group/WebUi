import {h} from '/js/src/index.js';
import {timerDebouncer} from '../utils.js';
import {objectId, clone, pointerId} from '../utils.js';

/**
 * Draw an object using JSROOT
 * if name change, re-create entire div
 * if data are loaded, redraw jsroot
 * if data change, redraw jsroot
 * if data did not change but model did, resize jsroot after CSS animations and debouncer
 *
 * @param {object} model - root model object
 * @param {TabObject|string} tabObject - the tabObject to draw, can be the name of object
 * @param {object} options - optional options of presentation
 * @return {vdom} output virtual-dom, a single div with JSROOT attached to it
 */
export function draw(model, tabObject, options) {
  options = {
    width: '100%', // CSS size
    height: '100%', // CSS size
    className: '', // any CSS class
    ...options,
  };

  if (typeof tabObject === 'string') {
    tabObject = {
      id: objectId(),
      name: tabObject,
      options: [],
      x: 0,
      y: 0,
      h: 0,
      w: 0,
    };
  }

  const attributes = {
    alt: cacheHash(model, tabObject),
    key: tabObject.name, // completly re-create this div if the chart is not the same at all
    class: options.className,
    style: {height: options.height, width: options.width},

    oncreate(vnode) {
      model.object.loadObject(tabObject.name);
      vnode.dom.onresize = timerDebouncer(() => JSROOT.resize(vnode.dom), 200);
      window.addEventListener('resize', vnode.dom.onresize);
      redrawOnDataUpdates(model, vnode.dom, tabObject);
    },

    onupdate(vnode) {
      redrawOnDataUpdates(model, vnode.dom, tabObject);
    },

    onremove(vnode) {
      // remove jsroot binding to avoid memory leak
      model.object.unloadObject(tabObject.name);
      JSROOT.cleanup(vnode.dom);
      window.removeEventListener('resize', vnode.dom.onresize);
    }
  };

  return h('div', attributes);
}

function redrawOnDataUpdates(model, dom, tabObject) {
  if (model.object.objects[tabObject.name] && dom.dataset.cacheHash !== cacheHash(model, tabObject)) {
    // cache control
    dom.dataset.cacheHash = cacheHash(model, tabObject);
    setTimeout(() => {
      JSROOT.redraw(dom, model.object.objects[tabObject.name], tabObject.options.join(';'));
    }, 0);
  }
}

function cacheHash(model, tabObject) {
  // help to identify when some data have changed to tell jsroot to redraw
  // pointerId returns a different number if object has been replaced by another
  return `${tabObject.name}:${model.object.objects[tabObject.name] ? pointerId(model.object.objects[tabObject.name]) : null}:${tabObject.options.join(';')}`;
}
