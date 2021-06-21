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

const PREFIX = {
  QC: {
    NONE: '-',
    JSON: 'json://',
    CONSUL: 'consul-json://'
  },
  READOUT: {
    NONE: '-',
    FILE: 'file://',
    CONSUL: 'consul-ini://'
  }
};

const WIDGET_VAR = {
  EDIT_BOX: 'EDIT_BOX',
  SLIDER: 'SLIDER',
  LIST_BOX: 'LIST_BOX',
  DROPDOWN_BOX: 'DROPDOWN_BOX',
  COMBO_BOX: 'COMBO_BOX',
};

const VAR_TYPE = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  BOOL: 'BOOL',
  ARRAY: 'ARRAY',
  JSON: 'JSON',
}

export {PREFIX, WIDGET_VAR, VAR_TYPE};