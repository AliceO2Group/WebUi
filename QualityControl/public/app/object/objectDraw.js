import {h} from '/js/src/index.js';
import {timerDebouncer} from '../utils.js';

export function draw(model, object, options) {
  options = {
    width: '100%', // CSS size
    height: '100%', // CSS size
    className: '', // any CSS class
    portrait: false,
    drawOptions: [], // JSROOT TStyles like logx, gridx, etc.
    ...options,
  };

  const attributes = {
    class: options.className,
    style: {height: options.height, width: options.width},

    oncreate(vnode) {
      model.object.loadObject(object.name);

      // Already loaded, let's draw in the div created
      if (model.object.objects[object.name]) {
        // cache control
        vnode.dom.dataset.version = model.object.objects[object.name].version;
        setTimeout(() => {
          JSROOT.redraw(vnode.dom, model.object.objects[object.name], options.drawOptions.join(';'))
        }, 0);
      }
    },

    onupdate(vnode) {
      if (model.object.objects[object.name] && vnode.dom.dataset.version !== model.object.objects[object.name].version) {
        vnode.dom.dataset.version = model.object.objects[object.name].version;
        setTimeout(() => {
          JSROOT.redraw(vnode.dom, model.object.objects[object.name], options.drawOptions.join(';'))
        }, 0);
      } else if (vnode.dom.dataset.version) {
        // in case other data are updated we do a simple resize of jsroot if window has changed size
        // but we do that after 0.2s, time of CSS animations to complete first, resizing is secondary
        // this increase user experience, animations need to be fluid
        setTimeout(() => {
          JSROOT.resize(vnode.dom);
        }, 200);
      }
    },

    onremove(vnode) {
      // remove jsroot binding to avoid memory leak
      model.object.unloadObject(object.name);
      JSROOT.cleanup(vnode.dom);
    }
  };

  return h('div', attributes);
}
