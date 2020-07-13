import {h, info} from '/js/src/index.js';

/**
 * Method to create and display an info button on top of a histogram
 * which expects an object
 * @param {Object} object
 * @return {vnode}
 */
export default (object) => object.selected && !object.isOnlineModeEnabled &&
  h('.p1.text-right', {style: 'padding-bottom: 0;'},
    h('.dropdown', {class: object.selectedOpen ? 'dropdown-open' : ''}, [
      h('button.btn',
        {
          title: 'View details about histogram',
          onclick: () => object.toggleInfoArea()
        }, info()
      ),
      h('.dropdown-menu', {style: 'right:0.1em; left: auto; white-space: nowrap;'}, [
        h('.m2.gray-darker.text-center', [
          h('.menu-title', {style: 'font-weight: bold; margin-bottom: 0'}, 'PATH'),
          h('select.form-control', h('option', '2/3/2020, 1:54:05 PM'))
        ]),
        h('.m2.gray-darker.text-center', [
          h('.menu-title', {style: 'font-weight: bold; margin-bottom: 0'}, 'PATH'),
          object.selected.name
        ]),
        h('.m2.gray-darker.text-center', [
          h('.menu-title', {style: 'font-weight: bold; margin-bottom: 0'}, 'LAST MODIFIED'),
          object.selected.lastModified ?
            `${new Date(object.selected.lastModified).toLocaleString()}`
            :
            'Loading...'
        ]),

      ]),
    ])
  );
