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

import {h, iconX} from '/js/src/index.js';

import {severityClass, severityLabel} from './severityUtils.js';

export default (model) => model.log.item ? h('', [
  h('table.table.f7.table-sm',
    h('colgroup', [
      h('col.cell-m'),
      h('col.cell-m'), // last column fills space
    ]),
    h('tbody', [
      h('tr', [
        h('td.cell-bordered', ''),
        h('td.cell.text-ellipsis.cell-xl',
          h('.f7.w-100.flex-column.items-end',
            h('.w-10.actionable-icon', {
              onclick: () => {
                model.inspectorEnabled = false;
                model.notify();
              }
            }, iconX())
          )
        )
      ]),
      h('tr', [
        h('td', {className: severityClass(model.log.item.severity)}, 'Severity'),
        h('td', {className: severityClass(model.log.item.severity)}, severityLabel(model.log.item.severity))
      ]),
      h('tr', h('td', 'Date'), h('td', (model.timezone.format(model.log.item.timestamp, 'date')))),
      h('tr', h('td', 'Time'), h('td', (model.timezone.format(model.log.item.timestamp, 'time')))),
      h('tr', h('td', 'Hostname'), h('td', model.log.item.hostname)),
      h('tr', h('td', 'Rolename'), h('td', model.log.item.rolename)),
      h('tr', h('td', 'PID'), h('td', model.log.item.pid)),
      h('tr', h('td', 'Username'), h('td', model.log.item.username)),
      h('tr', h('td', 'System'), h('td', model.log.item.system)),
      h('tr', h('td', 'Facility'), h('td', model.log.item.facility)),
      h('tr', h('td', 'Detector'), h('td', model.log.item.detector)),
      h('tr', h('td', 'Partition'), h('td', model.log.item.partition)),
      h('tr', h('td', 'Run'), h('td', model.log.item.run)),
      h('tr', h('td', 'ErrCode'), h('td', model.log.item.errcode)),
      h('tr', h('td', 'ErrLine'), h('td', model.log.item.errline)),
      h('tr', h('td', 'ErrSource'), h('td', model.log.item.errsource)),
    ])
  ),
  h('.p2.f7', h('', model.log.item.message))
]) : h('', {className: 'f6 text-center p3'}, 'Click on a log to show its properties');
