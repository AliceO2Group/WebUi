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

const {FlpTaskState} = require('./../common/taskState.enum.js');
const QC_NODES_NAME_REGEX = /alio2-cr1-q(c|me|ts)[0-9]{2}/;

/**
 * Enum with potential sources of tasks for AliECS environment
 * @readonly
 * @enum {String}
 */
const TASKS_SOURCE = {
  EPN: 'EPN',
  FLP: 'FLP',
  TRG: 'TRG',
  QC: 'QC',
}

/**
 * EnvironmentInfoAdapter - Given an AliECS Environment, construct an EnvironmentInfo object for GUI purposes
 */
class EnvironmentInfoAdapter {
  /**
   * EnvironmentInfoAdapter
   */
  constructor() {
  }

  /**
   * Converts the given proto object (o2control.proto) to an entity overview object.
   *
   * @param {EnvironmentInfoProto} protoObject - object to convert
   * @param {Array<String>} detectorsAll - list of all detectors in the current AliECS deployment
   * @param {Map<String, Array<String>>} hostsByDetector - object with list of hosts grouped by detector
   * @returns {EnvironmentInfo} entity of environment with needed information
   */
  static toOverviewEntity(environment, detectorsAll, hostsByDetector) {
    const {
      id,
      currentRunNumber,
      createdWhen,
      state = '',
      currentTransition = '',
      rootRole = '',
      description = '',
      numberOfFlps = 0,
      numberOfHosts = 0,
      numberOfTasks = 0,
      includedDetectors = [],
      defaults = {},
      vars = {},
      userVars = {},
      integratedServicesData = {},
    } = environment;

    /**
     * @type {EnvironmentInfo}
     */
    const environmentInfo = {
      id,
      currentRunNumber,
      createdWhen,
      state,
      currentTransition,
      rootRole,
      description,
      numberOfFlps,
      numberOfHosts,
      numberOfTasks,
      hardware: {
        ...EnvironmentInfoAdapter._getHardwareCountersPerComponent(environment, hostsByDetector),
        epn: EnvironmentInfoAdapter._getOdcCounters(integratedServicesData.odc ?? {}),
      },
      tasks: [],
      includedDetectors: includedDetectors.sort(),
      defaults: EnvironmentInfoAdapter._filterOutDetectorsVariables(defaults, includedDetectors, detectorsAll),
      vars: EnvironmentInfoAdapter._filterOutDetectorsVariables(vars, includedDetectors, detectorsAll),
      userVars: EnvironmentInfoAdapter._filterOutDetectorsVariables(userVars, includedDetectors, detectorsAll),
    };
    return environmentInfo;
  }

  /**
   * Method to build an environment info with tasks from specified source
   * @param {EnvironmentInfoProto} environment - environment as from AliECS
   * @param {String} taskSource - source of tasks
   * @param {Array<String>} detectorsAll - list of all detectors in the current AliECS deployment
   * @param {Map<String, Array<String>>} hostsByDetectors - object with list of hosts grouped by detector
   */
  static toEntity(environment, taskSource = '', detectorsAll, hostsByDetectors) {
    taskSource = taskSource.toLocaleUpperCase();

    const environmentInfo = EnvironmentInfoAdapter.toOverviewEntity(environment, detectorsAll, hostsByDetectors);
    if (taskSource === TASKS_SOURCE.EPN) {
      const {integratedServicesData: {odc = '{}'}} = environment;
      const odcParsed = JSON.parse(odc);
      environmentInfo.tasks = odcParsed.devices;
    } else if (taskSource === TASKS_SOURCE.FLP) {
      const {tasks = [], includedDetectors} = environment;
      environmentInfo.tasks = [];
      for (const task of tasks) {
        const {deploymentInfo: {hostname = ''} = {}} = task;
        const keyDetector = Object.keys(Object.fromEntries(hostsByDetectors))
          .filter((detector) => hostsByDetectors.get(detector).includes(hostname))[0];
        if (!hostname.match(QC_NODES_NAME_REGEX) && includedDetectors.includes(keyDetector)) {
          environmentInfo.tasks.push(task);
        }
      }
    } else if (taskSource === TASKS_SOURCE.QC) {
      const {tasks = []} = environment;
      environmentInfo.tasks = [];
      for (const task of tasks) {
        const {deploymentInfo: {hostname = ''} = {}} = task;
        if (hostname.match(QC_NODES_NAME_REGEX)) {
          environmentInfo.tasks.push(task);
        }
      }
    } else if (taskSource === TASKS_SOURCE.TRG) {
      const {tasks = [], includedDetectors} = environment;
      environmentInfo.tasks = [];
      for (const task of tasks) {
        const {deploymentInfo: {hostname = ''} = {}} = task;
        const keyDetector = Object.keys(Object.fromEntries(hostsByDetectors))
          .filter((detector) => hostsByDetectors.get(detector).includes(hostname))[0];
        if (!hostname.match(QC_NODES_NAME_REGEX) && !includedDetectors.includes(keyDetector)) {
          environmentInfo.tasks.push(task);
        }
      }
    }
    return environmentInfo;
  }

  /**
   * Given an environment, group its tasks by the 3 main categories: FLP, QC Nodes and CTP Readout
   * @param {EnvironmentInfo} environment - DTO representing an environment
   * @param {Map<String, Array<String>>} hostsByDetectors - hosts grouped by the detectors
   * @returns {object{tasks: Array<TaskInfo>, hosts: Set}} - Object with groups of tasks and set of unique hosts
   */
  static _getHardwareCountersPerComponent(environment, hostsByDetectors) {
    let qcTasksTotal = 0;
    const qcHosts = new Set();
    const qcStates = {};
    const qcStatuses = {};

    let flpTasksTotal = 0;
    const flpHosts = new Set();
    const flpStates = {};
    const flpStatuses = {};
    const flpDetectors = {};

    let trgTasksTotal = 0;
    const trgHosts = new Set();
    const trgStates = {};
    const trgStatuses = {};

    const {tasks = [], includedDetectors = []} = environment;

    for (const task of tasks) {
      const {critical = false, status = 'NOT-KNOWN', deploymentInfo: {hostname = ''} = {}} = task;
      let {state = FlpTaskState.UNKNOWN} = task;

      if (state === FlpTaskState.ERROR && critical) {
        state = FlpTaskState.ERROR_CRITICAL;
      }

      if (hostname.match(QC_NODES_NAME_REGEX)) {
        qcTasksTotal++;
        qcStates[state] = (qcStates[state] + 1) || 1;
        qcStatuses[status] = (qcStatuses[status] + 1) || 1;
        qcHosts.add(hostname);
      } else {
        const {userVars: {ctp_readout_enabled = 'false'} = {}} = environment;
        const isReadoutEnabled = ctp_readout_enabled === 'true';

        const keyDetector = Object.keys(Object.fromEntries(hostsByDetectors))
          .filter((detector) => hostsByDetectors.get(detector).includes(hostname))[0];
        if (includedDetectors.includes(keyDetector)) {
          flpTasksTotal++;
          flpStates[state] = (flpStates[state] + 1) || 1;
          flpStatuses[status] = (flpStatuses[status] + 1) || 1;
          if (!flpDetectors[keyDetector]) {
            flpDetectors[keyDetector] = {
              total: 0,
              states: {},
              statuses: {},
            };
          }
          flpDetectors[keyDetector].total++;
          flpDetectors[keyDetector].states[state] = (flpDetectors[keyDetector].states[state] + 1) || 1;
          flpDetectors[keyDetector].statuses[status] = (flpDetectors[keyDetector].statuses[status] + 1) || 1;

          flpHosts.add(hostname);
        } else if (isReadoutEnabled) {
          trgTasksTotal++;
          trgStates[state] = (trgStates[state] + 1) || 1;
          trgStatuses[status] = (trgStatuses[status] + 1) || 1;
          trgHosts.add(hostname);
        }
      }
    }

    return {
      qc: {
        tasks: {
          total: qcTasksTotal,
          states: qcStates,
          statuses: qcStatuses,
        },
        hosts: qcHosts.size,
      },
      flp: {
        tasks: {
          total: flpTasksTotal,
          states: flpStates,
          statuses: flpStatuses,
        },
        hosts: flpHosts.size,
        detectorCounters: flpDetectors,
      }, trg: {
        tasks: {
          total: trgTasksTotal,
          states: trgStates,
          statuses: trgStatuses,
        },
        hosts: trgHosts.size,
      }
    };
  }

  /**
   * Prepare an ODC object with hardware information based
   * @param {Map<String, Object>} integratedServicesData - object with details of the integrated services
   */
  static _getOdcCounters(odc = {}) {
    try {
      /**
       * @type {Array<DeviceInfo>} devices
       */
      const {devices = [], ddsSessionId = '', ddsSessionStatus = '', state = ''} = JSON.parse(odc);
      const states = {};
      const hosts = new Set();
      for (const device of devices) {
        const {state, host} = device;
        hosts.add(host);
        states[state] = (states[state] + 1) || 1;
      }
      return {
        tasks: {
          total: devices.length,
          states
        },
        hosts: hosts.size,
        info: {ddsSessionId, ddsSessionStatus, state}
      };
    } catch (error) {
      return {
        tasks: {
          total: 0,
          states: {},
        },
        hosts: 0,
        info: {ddsSessionId: '-', ddsSessionStatus: '-', state: '-'}
      };
    }
  }


  /**
   * Given a JSON containing environment information and a specific key:
   * * check if that key maps to an existing values
   * * remove any variables that are a detector variable but are not part of the included detector
   * @param {JSON} objectToFilterFrom - object from which var
   * @param {string} label
   * @return {JSON}
   */
  static _filterOutDetectorsVariables(objectToFilterFrom, includedDetectors, detectors) {
    const data = JSON.parse(JSON.stringify(objectToFilterFrom));
    for (const key of Object.keys(data)) {
      const prefixUpper = key.split('_')[0].toLocaleUpperCase();
      const isVariableDetector =
        detectors.findIndex((det) => det.toLocaleUpperCase() === prefixUpper) !== -1
      const isVariableIncludedDetector =
        includedDetectors.findIndex((det) => det.toLocaleUpperCase() === prefixUpper) !== -1;
      if (isVariableDetector && !isVariableIncludedDetector) {
        delete data[key]
      }
    }
    return data;
  }
}

module.exports = EnvironmentInfoAdapter;
