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

const {NotFoundError} = require('./../errors/NotFoundError.js');

/**
 * WorkflowTemplateService class to be used to retrieve data from AliEcs Core about workflow templates to be used for environment creation
 */
class WorkflowTemplateService {
  /**
   * Constructor for inserting dependencies needed to retrieve environment data
   * @param {GrpcProxy} coreGrpc 
   */
  constructor(coreGrpc) {
    this._coreGrpc = coreGrpc;
  }

  /**
   * Retrieve the default template that is to be used for data-processing
   * @returns {WorkflowTemplateSource}
   * @throws
   */
  async getDefaultTemplateSource() {
    const {repos: repositories} = await this._coreGrpc['ListRepos']();
    const defaultRepository = repositories.find((repository) => repository.default);

    if (!defaultRepository) {
      throw new NotFoundError(`Unable to find a default repository`);
    }
    const {name: repositoryName, defaultRevision} = defaultRepository;
    
    if (!defaultRevision) {
      throw new NotFoundError(`Unable to find a default revision`);
    }
    return {
      repository: repositoryName, 
      revision: defaultRevision,
      name: 'readout-dataflow'
    };
  }
}

module.exports = {WorkflowTemplateService};
