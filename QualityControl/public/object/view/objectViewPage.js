import {h, iconBook, iconCircleX, iconArrowThickLeft} from '/js/src/index.js';
import {draw} from './../objectDraw.js';

/**
 * Shows a page to view an object on the whole page
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.p2.absolute-fill', {style: 'display: flex; flex-direction: column'},
  [
    getActionsHeader(model),
    getRootObject(model)
  ]);


/**
 * Display the full path of the selected object or display a message
 * to inform the user expected parameter was not passed
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
      h('b.text-center.w-50', getObjectTitle(model)),
      getCopyURLToClipboardButton(model)
    ]);
}

/**
 * Button for redirecting the user back to QCG object tree page
 * @param {Object} model
 * @return {vnode}
 */
function getBackToQCGButton(model) {
  return h('.w-25',
    h('a.btn',
      {
        title: model.router.params.layoutId ? 'Go back to layout' : 'Go back to all objects',
        href: model.router.params.layoutId ? `?page=layoutShow&layoutId=${model.router.params.layoutId}` : '?page=objectTree',
        onclick: (e) => {
          model.router.handleLinkEvent(e);
        }
      },
      [
        iconArrowThickLeft(),
        ' ',
        model.router.params.layoutId ? 'Back to layout' : 'Back to QCG'
      ]
    )
  );
}

/**
 * Copy current location to the user's clipboard
 * @param {Object} model
 * @return {vnode}
 */
function getCopyURLToClipboardButton(model) {
  return h('.w-25', {style: 'display: flex; justify-content: flex-end'},
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
          oncreate: () => model.object.select({name: model.router.params.objectName}),
          style: 'width: 100%; height: 100%',
        },
        model.object.selected ? draw(model, model.object.selected.name) : null)
      : errorLoadingObject(''));
}

/**
 * Display error message & icon
 * @param {String} errorMessage
 * @return {vnode}
 */
function errorLoadingObject(errorMessage) {
  return h('',
    {style: 'flex-direction: column;font-size: 10em;'},
    [iconCircleX(), errorMessage]
  );
}
