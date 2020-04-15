import {h, info} from '/js/src/index.js';

/**
 * Method to create and display an info button on top of a histogram
 * which expects an object
 * @param {Object} object
 * @return {vnode}
 */
export default (object) => object.selectedObject.object&& !object.isOnlineModeEnabled &&
  h('.p1.text-right', {style: 'padding-bottom: 0;'},
    h('.dropdown', {class: object.selectedObject.isOpen ? 'dropdown-open' : ''}, [
      h('button.btn',
        {
          title: 'View details about histogram',
          onclick: () => object.toggleInfoArea()
        }, info()
      ),
      h('.dropdown-menu', {style: 'right:0.1em; left: auto; white-space: nowrap;'}, [
        h('.m2.gray-darker.text-center', [
          h('.menu-title', {style: 'font-weight: bold; margin-bottom: 0'}, 'PATH'),
          object.selectedObject.object.name
        ]),
        h('.m2.gray-darker.text-center', [
          h('.menu-title', {style: 'font-weight: bold; margin-bottom: 0'}, 'LAST MODIFIED'),
          object.selectedObject.object.lastModified ?
            `${new Date(object.selectedObject.object.lastModified).toLocaleString()}`
            :
            'Loading...'
        ]),

      ]),
    ])
  );
