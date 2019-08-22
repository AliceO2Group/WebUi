import {h, iconBook, iconCircleX, iconArrowThickLeft} from '/js/src/index.js';
import {draw} from './../objectDraw.js';

/**
 * Shows a page to explore though a tree of objects with a preview on the right if clicked
 * and a status bar for selected object name and # of objects
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.p2.absolute-fill',
  {
    style: {
      display: 'flex',
      'flex-direction': 'column',
    }
  },
  [
    getActionsHeader(model),
    getRootObject(model)
  ]);


/**
 * Display the full path of the selected object
 * @param {Object} model
 * @return {string}
 */
function getObjectTitle(model) {
  return model.router.params.objectName ? model.router.params.objectName : 'Please pass an objectName parameter';
}

/**
 * Generates a header which contains actions that can be applied
 * @param {Object} model
 * @return {vnode}
 */
function getActionsHeader(model) {
  return h('', {style: 'display: flex'},
    [
      getBackToQCGButton(model),
      h('b.text-center.w-33', getObjectTitle(model)),
      getCopyURLToClipboardButton(model)
    ]);
}

/**
 * Button for redirecting the user back to QCG object tree page
 * @param {Object} model
 * @return {vnode}
 */
function getBackToQCGButton(model) {
  return h('.w-33',
    h('a.btn',
      {
        title: 'Go back to QCG',
        href: `?page=objectTree`,
        onclick: (e) => {
          model.object.select(null);
          model.router.handleLinkEvent(e);
        }
      },
      [iconArrowThickLeft(), ' ', 'Back to QCG']));
}

/**
 * Copy current location to the user's clipboard
 * @param {Object} model
 * @return {vnode}
 */
function getCopyURLToClipboardButton(model) {
  return h('.w-33', {style: 'display: flex; justify-content: flex-end'},
    h('button.btn',
      {
        title: 'Copy URL Object',
        onclick: () => {
          model.notification.show('Object location has been copied to clipboard', 'primary', 2000);
          // TODO: Add copy to clipboard functionality
        },
        style: 'display: none'
      },
      [iconBook(), ' ', 'Copy URL']));
}

/**
 * Draws root object plot
 * @param {Object} model
 * @return {vnode}
 */
function getRootObject(model) {
  return h('.text-center', {style: 'flex-grow: 1; height:0;'},
    model.router.params.objectName ?
      h('',
        {
          oncreate: () => {
            model.object.select(model.router.params.objectName);
          },
          style: 'widht: 100%; height: 100%'
        },
        model.object.selected ? draw(model, model.router.params.objectName) : null)
      : errorLoadingObject(''));
}

/**
 * Display error message
 * @param {String} errorMessage
 * @return {vnode}
 */
function errorLoadingObject(errorMessage) {
  return h('',
    {style: 'flex-direction: column;font-size: 10em;'},
    [iconCircleX(), errorMessage]
  );
}
