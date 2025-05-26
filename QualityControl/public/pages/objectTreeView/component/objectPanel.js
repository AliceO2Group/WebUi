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
  const { objects, selected } = model.object;
  const selectedObjectName = selected.name;

  if (objects?.[selectedObjectName]) {
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
 * Creates the resize button element
 * @param {Model.router} router - the application router
 * @param {string} href - link for the full screen view
 * @returns {vnode} - virtual node element for resize button
 */
const resizeButton = (router, href) => h('.resize-button.flex-row', [
  h('.p1.text-left.pv0', h(
    'a.btn',
    {
      title: 'Open object plot in full screen',
      href,
      onclick: (e) => router.handleLinkEvent(e),
    },
    iconResizeBoth(),
  )),
]);

/**
 * Creates the main plot container
 * @param {Model} model - root model of the application
 * @param {string} name - name of the object
 * @returns {vnode} - virtual node element for the plot
 */
const plotSelection = (model, name) => h('', { style: 'height:77%;' }, draw(model, name, { stat: true }));

/**
 * Creates the info panel container with timestamp selector
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element for the info panel
 */
const infoPanel = (model) => h('.scroll-y', {}, [
  h('.w-100.flex-row.justify-center', h('.w-80', timestampSelectForm(model))),
  qcObjectInfoPanel(model, { 'font-size': '.875rem;' }),
]);

/**
 * Draw the object including the info button and history dropdown
 * @param {Model} model - root model of the application
 * @param {JSON} object - {qcObject, info, timestamps}
 * @returns {vnode} - virtual node element
 */
export const drawPlot = (model, object) => {
  const { router } = model;
  const { name, validFrom, id } = object;
  const href = `?page=objectView&objectName=${name}${validFrom ? `&ts=${validFrom}&id=${id}` : ''}`;

  return h('.h100.flex-column', [
    resizeButton(router, href),
    plotSelection(model, name),
    infoPanel(model),
  ]);
};

/**
 * Shows status of current tree with its options (online, loaded, how many)
 * @param {QCObject} object -  object model that handles state around object
 * @returns {vnode} - virtual node element
 */
export function statusBarLeft(object) {
  const { currentList, searchInput, searchResult } = object;
  let itemsInfo = 'Loading objects...';

  itemsInfo = searchInput ?
    `${searchResult.length} found of ${currentList.length} items` : `${currentList.length} items`;

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
