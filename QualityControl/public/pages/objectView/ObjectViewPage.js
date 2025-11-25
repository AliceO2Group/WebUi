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

import { h } from '/js/src/index.js';
import { draw } from './../../common/object/draw.js';
import { spinner } from './../../common/spinner.js';
import { errorDiv } from '../../common/errorDiv.js';
import { dateSelector } from '../../common/object/dateSelector.js';
import { qcObjectInfoPanel } from '../../common/object/objectInfoCard.js';
import { downloadButton } from '../../common/downloadButton.js';
import { visibilityToggleButton } from '../../common/visibilityButton.js';

/**
 * Shows a page to view an object on the whole page
 * @param {ObjectViewModel} objectViewModel - model that manages the objectView state
 * @returns {vnode} - virtual node element
 * @import { ObjectViewModel } from '../objectView/ObjectViewModel.js';
 */
export default (objectViewModel) =>
  h('.absolute-fill.flex-column', objectPlotAndInfo(objectViewModel));

/**
 * Build an element which plots the object and displays metadata information
 * @param {ObjectViewModel} objectViewModel - model for object view page
 * @returns {vnode} - virtual node element
 */
const objectPlotAndInfo = (objectViewModel) =>
  objectViewModel.selected.match({
    NotAsked: () => null,
    Loading: () => spinner(10, 'Loading object...'),
    Failure: (error) => errorDiv(error),
    Success: (qcObject) => {
      const {
        id,
        name,
        validFrom,
        ignoreDefaults = false,
        drawOptions = [],
        displayHints = [],
        layoutDisplayOptions = [],
        versions,
      } = qcObject;
      const drawingOptions = ignoreDefaults ?
        layoutDisplayOptions
        : [...drawOptions, ...displayHints, ...layoutDisplayOptions];
      const isObjectInfoVisible = objectViewModel.objectInfoVisible;
      return h('.w-100.h-100.flex-column.scroll-off#ObjectPlot', [
        h('.flex-row.justify-center.items-center.h-10', [
          h(
            '.w-40.p2.f6',
            dateSelector(
              { validFrom, id },
              versions,
              objectViewModel.updateObjectSelection.bind(objectViewModel),
            ),
          ),
          h('.item-action-row.flex-row.g1.p2', [
            downloadButton({
              href: objectViewModel.getDownloadQcdbObjectUrl(qcObject.id),
              title: 'Download object',
            }),
            visibilityToggleButton(
              {
                isVisible: isObjectInfoVisible,
                title: 'Toggle object information visibility',
              },
              () => objectViewModel.toggleObjectInfoVisible(),
            ),
          ]),
        ]),
        h('.w-100.flex-row.g2.m2', { style: 'height: 0;flex-grow:1' }, [
          h('.flex-grow', {
            // Key change forces redraw when toggling info panel
            key: isObjectInfoVisible ? 'objectPlotWithoutInfoPanel' : 'objectPlotWithInfoPanel',
          }, draw(objectViewModel.model.object, name, {}, drawingOptions)),
          isObjectInfoVisible && h('.scroll-y.w-30', {
            key: 'objectInfoPanel',
          }, [
            h('h3.text-center', 'Object information'),
            qcObjectInfoPanel(qcObject, { gap: '.5em' }),
          ]),
        ]),
      ]);
    },
  });
