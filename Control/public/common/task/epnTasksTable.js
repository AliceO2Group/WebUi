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

import {h} from '/js/src/index.js';
import { getTaskStateClassAssociation } from '../enums/TaskState.js';

/**
 * For a given host, build a table with tasks details
 * @param {Array<Task>} [tasks = []] - list of tasks to build table for
 * @return {vnode} table of the EPN tasks
 */
export const epnTasksTable = (tasks = []) => {
  const tableColumns = ['ID', 'Path', 'Ignored', 'State'];

  return h('table.table.table-sm', { style: 'margin-bottom: 0' }, [
    h('thead',
      h('tr', [
        tableColumns.map((header) => h('th', header)),
      ])
    ),
    h('tbody', [
      tasks.map(({ taskId, path, ignored, state }) =>
        h('tr', [
          h('td.w-30', taskId),
          h('td.w-50', path),
          h('td.w-10', ignored + ''),
          h(`td.w-10${getTaskStateClassAssociation(state)}`, state),
        ])
      ),
    ])
  ]);
};
