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

/**
 * Class which deals with setting up intervals for retrieving information constantly
 */
class Intervals {
  /**
   * Expected services to be used to retrieve information
   */
  constructor(statusService) {
    this._statusService = statusService;

    this._intervals = [];

  }

  /**
   * Method to initialize all intervals used by AlIECS GUI to acquire data
   */
  initializeIntervals() {
    this._statusService && this._initializeStatusIntervals();
  }

  /**
   * Sets interval to use {StatusService} to get data about the components which interact with AliECS GUI
   */
  _initializeStatusIntervals() {
    this._intervals.push(
      setInterval(() => {
        this._statusService.retrieveConsulStatus();
        this._statusService.retrieveAliEcsCoreInfo();
        this._statusService.retrieveAliECSIntegratedInfo();
        this._statusService.retrieveApricotStatus();
        this._statusService.retrieveGrafanaStatus();
        this._statusService.retrieveNotificationSystemStatus();
        this._statusService.retrieveSystemCompatibility();
      }, 10000)
    );
  }

}

exports.Intervals = Intervals;
