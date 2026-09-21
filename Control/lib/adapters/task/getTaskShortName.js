/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

/**
 * Method to parse a given full task name and return the short version of it
 * @param {string} taskName - full name of the task
 * @return {string} The name of the task without the full path
 */
const getTaskShortName = (taskName) => {
  const regex = new RegExp(`tasks/.*@`);
  const matchedTaskName = taskName.match(regex);
  if (matchedTaskName) {
    taskName = matchedTaskName[0].replace('tasks/', '').replace('@', '');
  }
  return taskName;
}

module.exports.getTaskShortName = getTaskShortName;
