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

/**
 * Concatenate the given parameters key path to form proper URL query param key
 *
 * @param {string[]} parametersKeysPath the keys path to concatenate
 * @return {string} the concatenated keys path
 */
const concatenateParametersKeyPath = (parametersKeysPath) => {
  if (parametersKeysPath.length === 0) {
    return 'no parameters keys';
  }

  const [mainKey, ...otherKeys] = parametersKeysPath;
  return `${mainKey}${otherKeys.map((key) => `[${key}]`).join('')}`;
};

/**
 * Error to be used when building parameters tree from keys path
 */
class ParameterBuildingError extends Error {
  /**
   * Constructor
   *
   * @param {string} message the global error message
   * @param {string[]} parametersKeysPath the parameters keys path where the error occurred
   */
  constructor(message, parametersKeysPath) {
    super(`${message} - ${concatenateParametersKeyPath(parametersKeysPath)}`);

    this._originalMessage = message;
    this._parametersKeysPath = parametersKeysPath;
  }

  /**
   * Return the orignal message of the error, without concatenated parameters key path
   *
   * @return {string} the original message
   */
  get originalMessage() {
    return this._originalMessage;
  }

  /**
   * Return the parameters keys path of the error
   *
   * @return {string[]} the parameters keys path
   */
  get parametersKeyPath() {
    return this._parametersKeysPath;
  }
}

/**
 * Build a parameter object or array from a parameters keys path
 *
 * For example, a parameter `key1[key2][]=value` translates to keys path ['key1', 'key2', ''] and will lead to {key1: {key2: [value]}}
 *
 * @param {object|array} parentParameter the parameter's object or array up to the current key
 * @param {array} nestedKeys the keys path to build from the current point
 * @param {string} value the value of the parameter represented by the key path
 * @return {void}
 */
const buildParameterFromNestedKeys = (parentParameter, nestedKeys, value) => {
  const currentKey = nestedKeys.shift();

  /*
   * Protect against prototype polluting assignment
   * https://codeql.github.com/codeql-query-help/javascript/js-prototype-polluting-assignment/
   */
  if (currentKey === '__proto__' || currentKey === 'constructor' || currentKey === 'prototype') {
    throw new Error(`Unauthorized parameters key ${currentKey}`);
  }

  if (currentKey === '') {
    // Parameter must be an array and the value is a new item in that array
    if (!Array.isArray(parentParameter)) {
      throw new ParameterBuildingError('Expected node in parameters tree to be an array', [currentKey]);
    }

    parentParameter.push(value);
  } else if (currentKey) {
    // Parameter must be an object and the value is a property in that array
    if (Array.isArray(parentParameter) || typeof parentParameter !== 'object' || parentParameter === null) {
      throw new ParameterBuildingError('Expected node in parameters tree to be an object', [currentKey]);
    }

    if (nestedKeys.length > 0) {
      // We still have nested keys to fill
      if (!(currentKey in parentParameter)) {
        parentParameter[currentKey] = nestedKeys[0] === '' ? [] : {};
      }

      try {
        buildParameterFromNestedKeys(parentParameter[currentKey], nestedKeys, value);
      } catch (e) {
        if (e instanceof ParameterBuildingError) {
          throw new ParameterBuildingError(e.originalMessage, [currentKey, ...e.parametersKeyPath]);
        }
        throw e;
      }
    } else {
      if (Array.isArray(parentParameter[currentKey])) {
        throw new ParameterBuildingError('Node in parameters tree is an array but no more nested keys', [currentKey]);
      } else if (typeof parentParameter[currentKey] === 'object' && parentParameter[currentKey] !== null) {
        throw new ParameterBuildingError('Node in parameters tree is an object but no more nested keys', [currentKey]);
      }
      parentParameter[currentKey] = value;
    }
  }
};

/**
 * Extract the parameters tree from the given URL parameters (any value after the "&" in a URL)
 *
 * @param {string} queryParameters the URL parameters string
 * @param {object} [parameters] the existing parameters tree object (will be modified in place)
 * @return {object} the parameter tree
 */
export const parseUrlParameters = (queryParameters, parameters) => {
  if (!queryParameters) {
    return {};
  }

  if (!parameters) {
    parameters = {};
  }

  for (const formattedParameter of queryParameters.split('&')) {
    const [key, value] = formattedParameter.split('=');
    const [firstKey, ...dirtyKeys] = key.split('[');
    const nestedKeys = [firstKey, ...dirtyKeys.map((key) => key.slice(0, -1))];

    buildParameterFromNestedKeys(parameters, nestedKeys, value);
  }

  return parameters;
};
