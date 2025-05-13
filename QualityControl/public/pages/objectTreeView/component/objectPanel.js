import { h, iconResizeBoth, iconCircleX } from '/js/src/index.js';
import { draw } from '../../../object/objectDraw.js';
import timestampSelectForm from '../../../common/timestampSelectForm.js';
import { qcObjectInfoPanel } from '../../../common/object/objectInfoCard.js';
import { spinner } from '../../../common/spinner.js';

/**
 * Method to tackle various states for the selected objects
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export function objectPanel(model) {
  const selectedObjectName = model.object.selected.name;
  if (model.object.objects && model.object.objects[selectedObjectName]) {
    return model.object.objects[selectedObjectName].match({
      NotAsked: () => null,
      Loading: () =>
        h('.h-100.w-100.flex-column.items-center.justify-center.f5', [spinner(3), h('', 'Loading Object')]),
      Success: (data) => drawPlot(model, data),
      Failure: (error) =>
        h('.h-100.w-100.flex-column.items-center.justify-center.f5', [h('.f1', iconCircleX()), error]),
    });
  }
  return null;
}

/**
 * Draw the object including the info button and history dropdown
 * @param {Model} model - root model of the application
 * @param {JSON} object - {qcObject, info, timestamps}
 * @returns {vnode} - virtual node element
 */
export const drawPlot = (model, object) => {
  const { name, validFrom, id } = object;
  const href = validFrom ?
    `?page=objectView&objectName=${name}&ts=${validFrom}&id=${id}`
    : `?page=objectView&objectName=${name}`;
  const info = object;
  return h('', { style: 'height:100%; display: flex; flex-direction: column' }, [
    h('.resize-button.flex-row', [
      h('.p1.text-left', { style: 'padding-bottom: 0;' }, h(
        'a.btn',
        {
          title: 'Open object plot in full screen',
          href,
          onclick: (e) => model.router.handleLinkEvent(e),
        },
        iconResizeBoth(),
      )),
    ]),
    h('', { style: 'height:77%;' }, draw(model, name, { stat: true })),
    h('.scroll-y', {}, [
      h('.w-100.flex-row', { style: 'justify-content: center' }, h('.w-80', timestampSelectForm(model))),
      qcObjectInfoPanel(info, { 'font-size': '.875rem;' }),
    ]),
  ]);
};

/**
 * Shows status of current tree with its options (online, loaded, how many)
 * @param {QCObject} object -  object model that handles state around object
 * @returns {vnode} - virtual node element
 */
export function statusBarLeft(object) {
  let itemsInfo = '';
  if (!object.currentList) {
    itemsInfo = 'Loading objects...';
  } else if (object.searchInput) {
    itemsInfo = `${object.searchResult.length} found of ${object.currentList.length} items`;
  } else {
    itemsInfo = `${object.currentList.length} items`;
  }

  return h('span.flex-grow', itemsInfo);
}

/**
 * Shows current selected object path
 * @param {QCObject} object -  object model that handles state around object
 * @returns {vnode} - virtual node element
 */
export const statusBarRight = (object) => object.selected
  ? h('span.right', object.selected.name)
  : null;
