/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

export const HardwareComponent = Object.freeze({
  FLP: 'FLP',
  EPN: 'EPN',
  QC: 'QC',
  TRG: 'CTP Readout',
});

/**
 * List of possible hardware components sorted alphabetically with FLP first
 * @returns {Array<string>} list of hardware components
 */
export const HARDWARE_COMPONENTS = Object.keys(HardwareComponent)
  .sort((a, b) => {
    if (a === 'FLP') {
      return -1;
    } else if (b === 'FLP') {
      return 1;
    } else {
      return a.localeCompare(b);
    }
  });
