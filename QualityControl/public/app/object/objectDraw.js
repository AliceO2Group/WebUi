import {h} from '/js/src/index.js';
import {timerDebouncer} from '../utils.js';
import {objectId, clone} from '../utils.js';

/**
 * Draw an object using JSROOT
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

  const drawingOptions = tabObject.options.join(';');

  function cacheHash(tabObject) {
    // help to identify when some data have changed to tell jsroot to redraw
    return `${tabObject.name}:${model.object.objects[tabObject.name].version}:${tabObject.options.join(';')}`;
  }

  const attributes = {
    class: options.className,
    style: {height: options.height, width: options.width},

    oncreate(vnode) {
      model.object.loadObject(tabObject.name);

      // Already loaded, let's draw in the div created
      if (model.object.objects[tabObject.name]) {
        // cache control
        vnode.dom.dataset.cacheHash = cacheHash(tabObject);
        setTimeout(() => {
          JSROOT.redraw(vnode.dom, model.object.objects[tabObject.name], tabObject.options.join(';'))
        }, 0);
      }
    },

    onupdate(vnode) {
      if (model.object.objects[tabObject.name] && vnode.dom.dataset.cacheHash !== cacheHash(tabObject)) {
        vnode.dom.dataset.cacheHash = cacheHash(tabObject);
        setTimeout(() => {
          JSROOT.redraw(vnode.dom, model.object.objects[tabObject.name], tabObject.options.join(';'))
        }, 0);
      } else if (vnode.dom.dataset.cacheHash) {
        // in case other data are updated we do a simple resize of jsroot if window has changed size
        // but we do that after 0.2s to avoid slowing down CSS animations while computing resizing
        // this increase user experience, animations need to be fluid
        setTimeout(() => {
          JSROOT.resize(vnode.dom);
        }, 200);
      }
    },

    onremove(vnode) {
      // remove jsroot binding to avoid memory leak
      model.object.unloadObject(tabObject.name);
      JSROOT.cleanup(vnode.dom);
    }
  };

  return h('div', attributes);
}
