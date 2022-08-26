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
 * RemoteData is tagged union type representing remote data loaded via network.
 * http://blog.jenkster.com/2016/06/how-elm-slays-a-ui-antipattern.html
 *
 * @template P, [E=Object]
 *
 * @example
 * import {RemoteData} from '/js/src/index.js';
 * var item = RemoteData.NotAsked();
 * item.isNotAsked() === true
 * item.isLoading() === false
 * item.match({
 *   NotAsked: () => 1,
 *   Loading: () => 2,
 *   Success: (data) => 3,
 *   Failure: (error) => 4,
 * }) === 1
 */
class RemoteData {

  /**
   * Private constructor, use factories.
   * @param {string} kind
   * @param {P|E|undefined} [payload]
   */
  constructor(kind, payload) {
    this.kind = kind;
    /**
     * @type {P|E|undefined}
     */
    this.payload = payload;
  }

  /**
   * Find the matching kind in the keys of `clauses` and returns
   * the computed value of the corresponding function.
   * An error is thrown if all clauses are not listed.
   * @param {Object} clauses
   * @param {function():*} clauses.NotAsked the function called when remote data kind is "NotAsked"
   * @param {function():*} clauses.Loading the function called when remote data kind is "NotAsked"
   * @param {function(P):*} clauses.Success the function called when remote data kind is "NotAsked"
   * @param {function(E):*} clauses.Failure the function called when remote data kind is "NotAsked"
   * @return {P|E|undefined} result of the function associated to clause
   * @example
   * import {RemoteData} from '/js/src/index.js';
   * var item = RemoteData.NotAsked();
   * item.match({
   *   NotAsked: () => 1,
   *   Loading: () => 2,
   *   Success: (data) => 3,
   *   Failure: (error) => 4,
   * }) === 1
   */
  match(clauses) {
    if (!clauses.NotAsked) {
      throw new Error('Missing clause `NotAsked`');
    }
    if (!clauses.Loading) {
      throw new Error('Missing clause `Loading`');
    }
    if (!clauses.Success) {
      throw new Error('Missing clause `Success`');
    }
    if (!clauses.Failure) {
      throw new Error('Missing clause `Failure`');
    }

    return clauses[this.kind].call(undefined, this.payload);
  }

  /**
   * Test is current kind is a `NotAsked`
   * @return {boolean}
   * @example
   * import {RemoteData} from '/js/src/index.js';
   * var item = RemoteData.NotAsked();
   * item.isNotAsked() === true
   * item.isLoading() === false
   */
  isNotAsked() {
    return this.kind === 'NotAsked';
  }

  /**
   * Test is current kind is a `Loading`
   * @return {boolean}
   * @example
   * import {RemoteData} from '/js/src/index.js';
   * var item = RemoteData.NotAsked();
   * item.isNotAsked() === true
   * item.isLoading() === false
   */
  isLoading() {
    return this.kind === 'Loading';
  }

  /**
   * Test is current kind is a `Success`
   * @return {boolean}
   */
  isSuccess() {
    return this.kind === 'Success';
  }

  /**
   * Test is current kind is a `Failure`
   * @return {boolean}
   */
  isFailure() {
    return this.kind === 'Failure';
  }

  /**
   * Factory to create new 'NotAsked' RemoteData kind
   * (NotAsked is not eslint compatible and deprecated, use notAsked)
   *
   * @return {RemoteData}
   * @static
   */
  static notAsked() {
    return new RemoteData('NotAsked');
  }

  /**
   * @see notAsked
   * @deprecated
   */
  static NotAsked() {
    return RemoteData.notAsked();
  }

  /**
   * Factory to create new 'Loading' RemoteData kind
   * (Loading is not eslint compatible and deprecated, use loading)
   *
   * @return {RemoteData}
   * @static
   */
  static loading() {
    return new RemoteData('Loading');
  }

  /**
   * @see loading
   * @deprecated
   * @static
   */
  static Loading() {
    return RemoteData.loading();
  }

  /**
   * Factory to create new 'Success' RemoteData kind
   * (Success is not eslint compatible and deprecated, use success)
   *
   * @param {P} payload
   * @return {RemoteData<P>}
   * @static
   */
  static success(payload) {
    return new RemoteData('Success', payload);
  }

  /**
   * @see success
   * @deprecated
   * @static
   */
  static Success(payload) {
    return RemoteData.success(payload);
  }

  /**
   * Factory to create new 'Failure' RemoteData kind
   * (Failure is not eslint compatible and deprecated, use failure)
   *
   * @param {E} payload
   * @return {RemoteData<*, E>}
   * @static
   */
  static failure(payload) {
    return new RemoteData('Failure', payload);
  }

  /**
   * @see RemoteData.failure
   * @deprecated
   * @static
   */
  static Failure(payload) {
    return RemoteData.failure(payload);
  }
}

export default RemoteData;
