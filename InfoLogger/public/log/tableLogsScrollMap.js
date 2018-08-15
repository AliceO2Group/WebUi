import {h, frameDebouncer} from '/js/src/index.js';
import {callRateLimiter} from '../common/utils.js';

/**
 * Returns a canvas vnode, severities are drawn on it and
 * adapts its height according to model
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('canvas', {
  width: '10px',
  height: model.log.scrollHeight + 'px',

  /**
   * Hook when DOM element is created according to vnode
   * registers a redraw function to be called on model changes
   * draw content
   * @param {vnode} vnode
   */
  oncreate(vnode) {
    // canvas consumes a lot of CPU
    // we put 2 FPS because it's almost a static picture for human eyes
    vnode.dom.redraw = frameDebouncer(callRateLimiter(() => {
      draw(model, vnode.dom);
    }, 500));
    vnode.dom.redraw();

    vnode.dom.dataset.height = model.log.scrollHeight;
  },

  /**
   * Hook when model has changed
   * check if height has changed since last time between DOM internal state
   * draw content
   * @param {vnode} vnode
   */
  onupdate(vnode) {
    // height change blanks canvas, draw now to avoid white canvas
    if (parseInt(vnode.dom.dataset.height, 10) !== model.log.scrollHeight) {
      draw(model, vnode.dom);
      vnode.dom.dataset.height = model.log.scrollHeight;
      return;
    }

    vnode.dom.redraw();
  }
});

/**
 * Draw the ScrollMap inside the canvas `dom` element provided in argument
 * @param {Object} model
 * @param {DOMElement} dom - canvas element to draw in
 */
const draw = (model, dom) => {
  // no place to paint
  if (!model.log.scrollHeight) {
    return;
  }

  const ctx = dom.getContext('2d');

  // Clear everything
  ctx.clearRect(0, 0, 30, 99729);

  // nothing to paint
  if (!model.log.list.length) {
    return;
  }

  // Draw a line for each log, a color per severity
  // Draw only a ratio of logs for performance
  const listLength = model.log.list.length;
  const incrementRatio = Math.max(1, Math.floor(model.log.list.length / model.log.scrollHeight));
  for (let i = 0; i < listLength; i += incrementRatio) {
    switch (model.log.list[i].severity) {
      case 'I':
        // ctx.strokeStyle = 'rgba(23, 162, 184, 0.05)';
        continue; // info is useless to draw
      case 'W':
        ctx.strokeStyle = 'rgba(255, 152, 0, 1)';
        break;
      case 'E':
        ctx.strokeStyle = 'rgba(220, 53, 69, 1)';
        break;
      case 'F':
        ctx.strokeStyle = 'rgba(156, 39, 176, 1)';
        break;
    }
    ctx.beginPath();
    ctx.moveTo(0, i * model.log.scrollHeight / model.log.list.length);
    ctx.lineTo(10, i * model.log.scrollHeight / model.log.list.length);
    ctx.closePath();
    ctx.stroke();
  }
};
