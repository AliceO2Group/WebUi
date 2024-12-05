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

import { filters } from '../../../common/filters/filter.js';
import { h } from '/js/src/index.js';

/**
 * Builds a panel containing multiple filters to allow user to apply for layout show/view
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const layoutFiltersPanel = ({ layout: layoutModel }) => {
  const { filter, setFilterValue, applyLayoutChanges, selectOption } = layoutModel;
  const { filterInput, autoSelector } = filters;
  const onClick = setFilterValue.bind(layoutModel);
  const onEnter = applyLayoutChanges.bind(layoutModel);
  const onChange = selectOption.bind(layoutModel);
  const filterService = model.services.filter;
  const { runTypes } = filterService;
  return h(
    '.w-100.flex-row.p2.g2',
    {
      onremove: () => {
        layoutModel.filter = {};
      } },
    [
      updateFiltersButton(layoutModel),
      filterInput('RunNumber', 'RunNumber (e.g. 546783)', 'runNumberLayoutFilter', filter, onClick, onEnter, 'number'),
      autoSelector(
        'RunType',
        'RunType (e.g. PHYSICS)',
        'runTypeLayoutFilter',
        filter,
        runTypes,
        onChange,
        onClick,
        onEnter,
      ),
      filterInput('PeriodName', 'PeriodName (e.g. LHC23c)', 'periodNameLayoutFilter', filter, onClick, onEnter),
      filterInput('PassName', 'PassName (e.g. apass2)', 'passNameLayoutFilter', filter, onClick, onEnter),
    ],
  );
};

/**
 * Button which will allow the user to update filter parameters after the input
 * @param {LayoutModel} layoutModel - root model of the application
 * @returns {vnode} - virtual node element
 */
const updateFiltersButton = (layoutModel) => h('', h('button.btn.btn-primary', {
  onclick: () => layoutModel.applyLayoutChanges(),
}, 'Update'));

export { layoutFiltersPanel };
