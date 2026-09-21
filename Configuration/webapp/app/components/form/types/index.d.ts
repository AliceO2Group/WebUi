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

export type FormValue = FormPrimitiveValue | FormArrayValue | FormObjectValue;

export type FormPrimitiveValue = string | number | boolean;

export type FormArrayValue = Array<FormValue>;

export type FormObjectValue = { [key: string]: FormValue };

export type PrimitiveRestrictions = 'string' | 'number' | 'boolean';

export type ArrayRestrictions = [
  Array<Restrictions>,
  ObjectRestrictions | null, // Restrictions for an object directly in the array
  ArrayRestrictions | null, // ArrayRestrictions for a directly nested array
];

export type ObjectRestrictions = {
  [key: string]: Restrictions;
};

export type Restrictions = PrimitiveRestrictions | ArrayRestrictions | ObjectRestrictions;
