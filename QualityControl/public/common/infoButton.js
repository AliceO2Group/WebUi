import {h, info} from '/js/src/index.js';

/**
 * Method to create and display an info button on top of a histogram
 * which expects an object
 * @param {Object} object
 * @return {vnode}
 */
export default (object) => object.selected && h('.p1.text-right', {style: 'padding-bottom: 0;'},
  h('.dropdown', {class: object.selectedOpen ? 'dropdown-open' : ''}, [
    h('button.btn',
      {
        title: 'View details about histogram',
        onclick: () => object.toggleInfoArea()
      }, info()
    ),
    h('.dropdown-menu', {style: 'right:0.1em; left: auto;white-space: nowrap;'}, [
      h('.m3.gray-darker', `Path: ${object.selected.name}`),
      h('.m3.gray-darker', `Last modified: ${new Date(object.selected.lastModified).toLocaleString()}`)
    ]),
  ]));
