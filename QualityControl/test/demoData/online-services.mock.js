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

export const ONLINE_SERVICES = {
  Main_QC_TASK: {
    ID: 'Main_QC_TASK',
    Service: 'Main_QC_TASK',
    Tags:
      [
        'QcTask/example',
        'ITSRAWDS/example'
      ],
    Meta: {},
    Port: 80,
    Address: '',
    Weights: {Passing: 1, Warning: 1},
    EnableTagOverride: false
  },
  SOME_OTHER_qc_task: {
    ID: 'SOME_OTHER_qc_task',
    Service: 'SOME_OTHER_qc_task',
    Tags:
      [
        'QcTask/other',
        'TOF_RAWS/example'
      ],
    Meta: {},
    Port: 80,
    Address: '',
    Weights: {Passing: 1, Warning: 1},
    EnableTagOverride: false
  },
  ONE_LAST_QC_TASK: {
    ID: 'LAST_QC_TASK',
    Service: 'LAST_QC_TASK',
    Tags:
      [
        'QcTask/p2',
        'ABC/p2'
      ],
    Meta: {},
    Port: 80,
    Address: '',
    Weights: {Passing: 1, Warning: 1},
    EnableTagOverride: false
  }
};
