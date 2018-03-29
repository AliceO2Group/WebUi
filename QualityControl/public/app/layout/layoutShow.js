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
      model.layout.item.tabs.map(folder => [
        h('a.button', {class: model.layout.tab.name === folder.name ? 'default active' : 'default'}, folder.name),
        ' '
      ]),
    ]),
    ' ',
    h('a.button.default', '+')
  ]);
}

function tabShow(model) {
  if (!model.layout.tab) {
    return;
  }

  if (!model.layout.tab.objects.length) {
    return h('.m4', [
      h('h1', 'Empty list'),
      h('p', 'Owner can edit this tab to add objects to see.')
    ]);
  }

  const tabObjects = model.layout.tab.objects.concat().sort(compare);
  function compare(a, b) {
    if (a.name < b.name)
      return -1;
    if (a.name > b.name)
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
      if (!model.layout.tabObjectMoving) {
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
      model.layout.moveTabObjectToPosition(x, y);
    },
    ondragend(e) {
      model.layout.moveTabObjectStop();
    }
  };

  return h('div', attrs2, [
    tabObjects.map((tabObject) => {
      const key = tabObject.name;
      const style = {
        height: (cellHeight * tabObject.h) + 'px',
        width: (cellWidth * tabObject.w) + '%',
        top: (tabObject.y * cellHeight) + 'px',
        left: (tabObject.x * cellWidth) + '%',
        opacity: (model.layout.tabObjectMoving && tabObject === model.layout.tabObjectMoving ? '0.1' : '1')
      };

      const draggable = model.layout.editEnabled;
      const ondragstart = model.layout.editEnabled ? () => model.layout.moveTabObjectStart(tabObject) : null;
      const onclick = model.layout.editEnabled ? () => model.layout.editTabObject(tabObject) : null;

      const attrs = {
        alt: key,
        key,
        style,
        draggable,
        ondragstart,
        onclick
      };

      return h('.absolute.animate-dimensions-position', attrs, [
        h('.bg-white.m1.fill-parent.object-shadow.br3', {class: model.layout.editingtabObject === tabObject ? 'object-selected' : ''}, draw(model, tabObject, {style: tabObject.options})),
        model.layout.editEnabled && h('.object-edit-layer.fill-parent.m1.br3')
      ]);
    })
  ]);
}
