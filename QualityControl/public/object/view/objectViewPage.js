/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

import {h, iconBook, iconCircleX, iconArrowThickLeft} from '/js/src/index.js';
import {draw} from './../objectDraw.js';
import infoButton from './../../common/infoButton.js';
import timestampSelectForm from '../../common/timestampSelectForm.js';

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
  return model.router.params.objectName ?
    model.router.params.objectName
    : (
      model.router.params.objectId && model.router.params.layoutId &&
      model.layout.requestedLayout.match({
        NotAsked: () => null,
        Loading: () => null,
        Success: (layout) =>
          model.object.getObjectNameByIdFromLayout(layout, model.router.params.objectId) &&
          h('.flex-row', {style: 'justify-content: center;'}, [
            model.object.getObjectNameByIdFromLayout(layout, model.router.params.objectId),
            h('.text-light', `(${layout.name})`)
          ]),
        Failure: () => null
      })
    );
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
      h('.text-center.flex-column', {style: 'flex-grow:1'}, [
        h('b', getObjectTitle(model)),
        h('.w-100.flex-row', {style: 'justify-content: center'},
          h('.w-25.p2.f6', timestampSelectForm(model))
        )
      ]),
      h('.flex-row', [
        infoButton(model.object, model.isOnlineModeEnabled),
        model.isContextSecure() && getCopyURLToClipboardButton(model)
      ])
    ]);
}

/**
 * Button for redirecting the user back to QCG object tree page
 * @param {Object} model
 * @return {vnode}
 */
function getBackToQCGButton(model) {
  return h('',
    h('a.btn', {
      title: model.router.params.layoutId ? 'Go back to layout' : 'Go back to all objects',
      href: model.router.params.layoutId ?
        `?page=layoutShow&layoutId=${model.router.params.layoutId}`
        : '?page=objectTree',
      onclick: (e) => {
        model.router.handleLinkEvent(e);
      }
    }, [
      iconArrowThickLeft(),
      ' ',
      model.router.params.layoutId ? 'Back to layout' : 'Back to QCG'
    ])
  );
}

/**
 * Copy current location to the user's clipboard
 * @param {Object} model
 * @return {vnode}
 */
function getCopyURLToClipboardButton(model) {
  return h('.p1', {style: ''},
    h('button.btn',
      {
        title: 'Copy URL Object',
        onclick: () => {
          model.notification.show('URL has been successfully copied to clipboard', 'success', 1500);
          navigator.clipboard.writeText(model.router.getUrl().href);
        }
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
      ( // means from objectTree
        h('', {
          oncreate: () => model.object.select({name: model.router.params.objectName}),
          style: 'width: 100%; height: 100%',
        }, model.object.selected ?
          draw(model, model.object.selected.name, {stat: true}, 'objectView')
          : errorLoadingObject(`Object ${model.router.params.objectName} could not be loaded`)
        )
      ) :
      // means layout
      model.router.params.objectId ?
        model.router.params.layoutId ?
          model.layout.requestedLayout.match({
            NotAsked: () => null,
            Loading: () => null, // TODO Investigate why RemoteData is displaying both states simultaneously
            Success: () => showObject(model),
            Failure: (error) => errorLoadingObject(error),
          })
          :
          errorLoadingObject('No layout ID was provided')
        : errorLoadingObject('No object name or object ID were provided')
  );
}

/**
 * Draw an object based on selected object
 * @param {Object} model
 * @return {vnode}
 */
const showObject = (model) =>
  model.object.selected ?
    h('.w-100.h-100', draw(model, model.object.selected.name, {stat: true}, 'objectView'))
    :
    errorLoadingObject('Object could not be found');

/**
 * Display error message & icon
 * @param {String} errorMessage
 * @return {vnode}
 */
function errorLoadingObject(errorMessage) {
  return h('.flex-column',
    [h('.f1', iconCircleX()), h('span.f3', errorMessage)]
  );
}
