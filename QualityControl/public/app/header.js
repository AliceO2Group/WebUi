import {h} from '/js/src/index.js';

import spinner from './Loader/spinner.js'
import layoutShowHeader from './layout/layoutShowHeader.js'
import layoutListHeader from './layout/layoutListHeader.js'
import objectTreeHeader from './object/objectTreeHeader.js'

export default function header(model) {
  return h(".flex-row.p2", [
    commonHeader(model),
    headerSpecific(model)
  ]);
}

function headerSpecific(model) {
  switch (model.page) {
    case 'layoutList': return layoutListHeader(model); break;
    case 'layoutShow': return layoutShowHeader(model); break;
    case 'objectTree': return objectTreeHeader(model); break;
    default: return defaultHeader(model);
  }
}

function defaultHeader(model) {
  return h('.w-100'); // fill the space
}

function commonHeader(model) {
  return h('.w-100', [
    h("button.button.default.mh1", {onclick: e => model.toggleSidebar(), class: model.sidebar ? 'active' : ''},
      [
        h("svg.icon[fill='none'][stroke='currentcolor'][stroke-linecap='round'][stroke-linejoin='round'][stroke-width='3'][viewBox='0 0 32 32']",
          h("path[d='M4 8 L28 8 M4 16 L28 16 M4 24 L28 24']")
        )
      ]
    ),
    h("button.button.default.mh1", {},
      [
        h("svg.icon[fill='currentcolor'][viewBox='0 0 8 8']",
          h("path[d='M3.5 0l-.5 1.188-.281.125-1.188-.5-.719.719.5 1.188-.125.281-1.188.5v1l1.188.5.125.313-.5 1.156.719.719 1.188-.5.281.125.5 1.188h1l.5-1.188.281-.125 1.188.5.719-.719-.5-1.188.125-.281 1.188-.5v-1l-1.188-.5-.125-.281.469-1.188-.688-.719-1.188.5-.281-.125-.5-1.188h-1zm.5 2.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z'][id='cog']")
        )
      ]
    ),
    model.loader.active && h('span.f4.mh1.gray', spinner())
  ]);
}

function layout2Header(model) {
  return [
    h('.w-100'),
    h("input.form-control[placeholder='Search'][type='search'].mh1"),
    h("button.button.default.mh1",
      h("svg.icon[fill='currentcolor'][viewBox='0 0 8 8']",
        h("path[d='M4 0l-1 3h-3l2.5 2-1 3 2.5-2 2.5 2-1-3 2.5-2h-3l-1-3z'][id='star']")
      )
    ),
    h(".button-group.mh1",
      [
        h("button.button.default", {onclick: e => model.zoomOut()},
          [
            h("svg.icon[fill='currentcolor'][viewBox='0 0 8 8']",
              h("path[d='M3.5 0c-1.927 0-3.5 1.573-3.5 3.5s1.573 3.5 3.5 3.5c.592 0 1.166-.145 1.656-.406a1 1 0 0 0 .094.094l1.031 1.031a1.016 1.016 0 1 0 1.438-1.438l-1.031-1.031a1 1 0 0 0-.125-.094c.266-.493.438-1.059.438-1.656 0-1.927-1.573-3.5-3.5-3.5zm0 1c1.387 0 2.5 1.113 2.5 2.5 0 .587-.196 1.137-.531 1.563l-.031.031a1 1 0 0 0-.063.031 1 1 0 0 0-.281.281 1 1 0 0 0-.063.063c-.422.326-.953.531-1.531.531-1.387 0-2.5-1.113-2.5-2.5s1.113-2.5 2.5-2.5zm-1.5 2v1h3v-1h-3z'][id='zoom-out']")
            )
          ]
        ),
        h("button.button.default", {onclick: e => model.zoomReset()},
          [
            h("svg.icon[fill='currentcolor'][viewBox='0 0 8 8']",
              h("path[d='M0 0v4l1.5-1.5 1.5 1.5 1-1-1.5-1.5 1.5-1.5h-4zm5 4l-1 1 1.5 1.5-1.5 1.5h4v-4l-1.5 1.5-1.5-1.5z'][id='fullscreen-enter']")
            )
          ]
        ),
        h("button.button.default", {onclick: e => model.zoomIn()},
          [
            h("svg.icon[fill='currentcolor'][viewBox='0 0 8 8']",
              h("path[d='M3.5 0c-1.927 0-3.5 1.573-3.5 3.5s1.573 3.5 3.5 3.5c.592 0 1.166-.145 1.656-.406a1 1 0 0 0 .094.094l1.031 1.031a1.016 1.016 0 1 0 1.438-1.438l-1.031-1.031a1 1 0 0 0-.125-.094c.266-.493.438-1.059.438-1.656 0-1.927-1.573-3.5-3.5-3.5zm0 1c1.387 0 2.5 1.113 2.5 2.5 0 .587-.196 1.137-.531 1.563l-.031.031a1 1 0 0 0-.063.031 1 1 0 0 0-.281.281 1 1 0 0 0-.063.063c-.422.326-.953.531-1.531.531-1.387 0-2.5-1.113-2.5-2.5s1.113-2.5 2.5-2.5zm-.5 1v1h-1v1h1v1h1v-1h1v-1h-1v-1h-1z'][id='zoom-in']")
            )
          ]
        )
      ]
    )
  ];
}

