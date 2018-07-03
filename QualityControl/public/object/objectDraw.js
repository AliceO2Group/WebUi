import {h} from '/js/src/index.js';
import {timerDebouncer, objectId, clone, pointerId} from '../common/utils.js';

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
  const defaultOptions = {
    width: '100%', // CSS size
    height: '100%', // CSS size
    className: '', // any CSS class
  };

  options = Object.assign({}, defaultOptions, options);

  if (typeof tabObject === 'string') {
    tabObject = {
      id: tabObject,
      name: tabObject,
      options: [],
      x: 0,
      y: 0,
      h: 0,
      w: 0,
    };
  }

  const attributes = {
    alt: keyHash(tabObject),
    key: keyHash(tabObject), // completly re-create this div if the chart is not the same at all
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
      if (JSROOT.cleanup) {
        // cleanup might not be loaded yet
        JSROOT.cleanup(vnode.dom);
      }
      window.removeEventListener('resize', vnode.dom.onresize);
    }
  };

  let inner = null;
  if (!model.object.objects[tabObject.name]) {
    // data are null, it means an error of reading occured
    inner = h('.absolute-fill.flex-column.items-center.justify-center', [
      h('.animate-slow-appearance', 'Loading')
    ]);
  } else if (model.object.objects[tabObject.name] === null) {
    // data are null, it means an error of reading occured
    inner = h('.absolute-fill.flex-column.items-center.justify-center', [
      h('.p4', 'No data available')
    ]);
  } else if (model.object.objects[tabObject.name] && model.object.objects[tabObject.name].error) {
    // data are null, it means an error of reading occured
    inner = h('.absolute-fill.flex-column.items-center.justify-center', [
      h('.p4', model.object.objects[tabObject.name].error),
    ]);
  }

  return h('div.relative', attributes, inner);
}

function redrawOnDataUpdates(model, dom, tabObject) {
  if (model.object.objects[tabObject.name] && !model.object.objects[tabObject.name].error && dom.dataset.cacheHash !== cacheHash(model, tabObject)) {
    // cache control
    dom.dataset.cacheHash = cacheHash(model, tabObject);
    setTimeout(() => {
      JSROOT.redraw(dom, model.object.objects[tabObject.name], tabObject.options.join(';'), (painter) => {
        if (painter === null) {
          // jsroot failed to paint it
          model.object.invalidObject(tabObject.name);
        }
      });
    }, 0);
  }
}

function keyHash(tabObject) {
  // Each time this key change means the jsroot plot must be redone.
  // Like: tabObject changed, options changed, dimension changed (need redraw!)
  return `${tabObject.id}:${tabObject.options.join(';')}:${tabObject.h}:${tabObject.w}`;
}

function cacheHash(model, tabObject) {
  // help to identify when some data have changed to tell jsroot to redraw
  // pointerId returns a different number if object has been replaced by another
  const dataPointerId = model.object.objects[tabObject.name] ? pointerId(model.object.objects[tabObject.name]) : null;
  return `${keyHash(tabObject)}:${dataPointerId}}`;
}
