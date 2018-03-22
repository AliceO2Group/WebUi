import {h} from '/js/src/index.js';
import {draw} from '../object/objectDraw.js';

export default function layouts(model) {
  return h('.scroll-y.fill-parent.bg-gray-light', {onupdate: (vnode) => {
    vnode.dom.style.setProperty('--h', vnode.dom.offsetHeight + 'px');
    model.layout.setCanvasHeight(vnode.dom.offsetHeight);
  } },
    [
      tabShow(model)
    ]
  );
}

function tabNav(model) {
  return h('div', [
    h('.button-group', [
      model.layout.item.folders.map(folder => [
        h('a.button', {class: model.layout.tab.name === folder.name ? 'default active' : 'default'}, folder.name),
        ' '
      ]),
    ]),
    ' ',
    h('a.button.default', '+')
  ]);
}

function tabShow(model) {
  if (!model.layout.gridList.items.length) {
    return h('.m4', [
      h('h1', 'Empty list'),
      h('p', 'Owner can edit this tab to add objects to see.')
    ]);
  }

  const items = model.layout.gridList.items.concat().sort(compare);
  function compare(a, b) {
    if (a.object.name < b.object.name)
      return -1;
    if (a.object.name > b.object.name)
      return 1;
    return 0;
  }
  const cellHeight = model.layout.canvasHeight * 0.95 / 3;
  const cellWidth = 33.33; // %

  const attrs2 = {
    style: {
      height: cellHeight * model.layout.gridList.grid.length + 'px'
    },
    ondragover(e) {
      // avoid events from other draggings things (files, etc.)
      if (!model.layout.itemMoving) {
        return;
      }
      // console.log('ondragend:', e);
      window.end = e;

      // canvas is the div contaning all graphs' divs
      const canvasDimensions = e.target.parentElement.parentElement.getBoundingClientRect();
      const pageX = e.pageX;
      const pageY = e.pageY;
      const canvasX = pageX - canvasDimensions.x;
      const canvasY = pageY - canvasDimensions.y;

      const cellWidth2 = canvasDimensions.width / 3;

      if (!pageX) {
        return;
      }

      // position in the gridList
      const x = Math.floor(canvasX / cellWidth2);
      const y = Math.floor(canvasY / cellHeight);

      // console.log(x, y, pageX, canvasDimensions.x);
      model.layout.moveItemToPosition(x, y);
    },
    ondragend(e) {
      model.layout.moveItemStop();
    }
  };

  return h('div', attrs2, [
    items.map((item) => {
      const key = item.object.name;
      const style = {
        height: (cellHeight * item.h) + 'px',
        width: (cellWidth * item.w) + '%',
        top: (item.y * cellHeight) + 'px',
        left: (item.x * cellWidth) + '%',
        opacity: (model.layout.itemMoving && item.object === model.layout.itemMoving ? '0.1' : '1')
      };

      const draggable = model.layout.editEnabled;
      const ondragstart = model.layout.editEnabled ? () => model.layout.moveItemStart(item) : null;
      const onclick = model.layout.editEnabled ? () => model.layout.editItem(item) : null;

      const attrs = {
        alt: key,
        key,
        style,
        draggable,
        ondragstart,
        onclick
      };

      return h('.absolute.animate-dimensions-position', attrs, [
        h('.bg-white.m1.fill-parent.object-shadow.br3', {class: model.layout.editingItem === item ? 'object-selected' : ''}, draw(model, item.object)),
        model.layout.editEnabled && h('.object-edit-layer.fill-parent.m1.br3')
      ]);
    })
  ]);
}
