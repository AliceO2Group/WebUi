import {h} from '/js/src/index.js';
import {callRateLimiter} from '../common/utils.js';

export default (model) => h('canvas', {
  width: '10px',
  height: model.log.scrollHeight + 'px',

  onupdate: callRateLimiter((vnode) => {
    // no place to paint
    if (!model.log.scrollHeight) {
      return;
    }

    const ctx = vnode.dom.getContext('2d');

    // Clear everything
    ctx.clearRect(0, 0, 30, 99729);

    // nothing to paint
    if (!model.log.list.length) {
      return;
    }

    // Draw a line for each log, a color per severity
    for (var i = 0; i < model.log.list.length; i += Math.max(1, Math.floor(model.log.list.length / model.log.scrollHeight))) {
      switch(model.log.list[i].severity) {
        case 'I':
          continue; // info is useless to draw
          ctx.strokeStyle = 'rgba(23, 162, 184, 0.05)';
          break;
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
  }, 500), // canvas consumes a lot of CPU, 15 FPS is fine, but we put 2 FPS because it's almost a static picture for human eyes
});