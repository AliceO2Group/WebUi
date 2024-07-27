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
 * @template T
 * @template P
 * @template E
 * @typedef ExhaustiveMatchClauses
 *
 * @property {() => T} NotAsked function called when applying `match` on not asked remote data
 * @property {() => T} Loading function called when applying `match` on loading remote data
 * @property {(payload: P) => T} Success function called when applying `match` on success remote data
 * @property {(error: E) => T} Failure function called when applying `match` on failure remote data
 */

/**
 * @template T, P, E
 * @typedef {ExhaustiveMatchClauses<T, P, E>|(Partial<ExhaustiveMatchClauses<T, P, E>>&{Other: () => T})} MatchClauses
 */

/**
 * RemoteData is tagged union type representing remote data loaded via network.
 * http://blog.jenkster.com/2016/06/how-elm-slays-a-ui-antipattern.html
 *
 * @template P
 * @template E
 *
 * @example
 * import {RemoteData} from '/js/src/index.js';
 * var item = RemoteData.notAsked();
 *
 * // Using all branches explicitly
 * item.match({
 *   NotAsked: () => 1,
 *   Loading: () => 2,
 *   Success: (data) => 3,
 *   Failure: (error) => 4,
 * }) === 1 // => true
 *
 * // Or using
 * items.match({
 *   Success: (data) => data,
 *   Other: () => [] // NotAsked is included in here
 * }).length > 0 // => true
 */
export class RemoteData {
  /**
   * Find the matching kind in the keys of `clauses` and returns the computed value of the corresponding function.
   * An error is thrown if all clauses are not listed.
   *
   * @template T return type of the callbacks
   *
   * @param {MatchClauses} clauses the match clauses to apply
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
  match(clauses) { // eslint-disable-line no-unused-vars
    throw new Error('Abstract function call');
  }

  /**
   * Return a new remote data (shallow copy) build from transformation on the current data or error
   *
   * @template NP the type of the transformed success data
   * @template NE the type of the transformed error
   *
   * @param {Partial<{Success: (payload: P) => NP, Failure: (error: E) => NE}>} transformation the transformation to apply to
   *     concrete data transform from the current remote data to the new one
   * @return {RemoteData<NP, NE>} the resulting remote data
   */
  apply(transformation) {
    return this.match({
      NotAsked: () => RemoteData.notAsked(),
      Loading: () => RemoteData.loading(),
      Success: (payload) => RemoteData.success(transformation.Success ? transformation.Success(payload) : payload),
      Failure: (error) => RemoteData.failure(transformation.Failure ? transformation.Failure(error) : error),
    });
  }

  /**
   * Verify that the provided match clauses is exhaustive
   *
   * @param {MatchClauses} clauses the match clauses to validate
   * @protected
   */
  _validateMatchClauses(clauses) {
    if (clauses.Other) {
      return;
    }

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
  }

  /**
   * Returns the remote data payload if it applies
   *
   * @return {P|E|undefined} the remote data payload or error
   * @deprecated use {@see RemoteData#match} or {@see RemoteData#apply}
   */
  get payload() {
    return undefined;
  }

  /**
   * Returns the kind of the remote data
   * @deprecated use {@see RemoteData#match} or {@see RemoteData#apply}
   */
  get kind() {
    throw new Error('Abstract function call');
  }

  /**
   * Test if current kind is a `NotAsked`
   * @return {boolean} - true if current kind is a `NotAsked`
   * @deprecated use {@see RemoteData#match} or {@see RemoteData#apply} instead
   */
  isNotAsked() {
    return false;
  }

  /**
   * Test is current kind is a `Loading`
   * @return {boolean} - true if current kind is a `Loading`
   * @example
   * @deprecated use {@see RemoteData#match} or {@see RemoteData#apply} instead
   */
  isLoading() {
    return false;
  }

  /**
   * Test is current kind is a `Success`
   * @deprecated use {@see RemoteData#match} or {@see RemoteData#apply} instead
   * @return {boolean} - true if current kind is a `Success`
   */
  isSuccess() {
    return false;
  }

  /**
   * States if current kind is a `Failure`
   * @deprecated use {@see RemoteData#match} or {@see RemoteData#apply} instead
   * @return {boolean} - true if current kind is a `Failure`
   */
  isFailure() {
    return false;
  }

  /**
   * Factory to create new 'NotAsked' RemoteData kind
   *
   * @template P
   * @template E
   *
   * @return {RemoteData<P, E>} - not asked remote data object
   * @static
   */
  static notAsked() {
    return new NotAskedRemoteData();
  }

  /**
   * RemoteData for NotAsked
   * @deprecated use {@see RemoteData#notAsked}
   */
  static NotAsked() {
    return RemoteData.notAsked();
  }

  /**
   * Factory to create new 'Loading' RemoteData kind
   *
   * @template P
   * @template E
   *
   * @return {RemoteData<P, E>} - loading remote data object
   * @static
   */
  static loading() {
    return new LoadingRemoteData();
  }

  /**
   * RemoteData for Loading
   * @deprecated use {@see RemoteData#loading}
   * @static
   */
  static Loading() {
    return RemoteData.loading();
  }

  /**
   * Factory to create new 'Success' RemoteData kind
   *
   * @template P
   * @template E
   *
   * @param {P} payload - to be set as payload
   * @return {RemoteData<P, E>} - success remote data with payload
   * @static
   */
  static success(payload) {
    return new SuccessRemoteData(payload);
  }

  /**
   * RemoteData for Success
   * @param {object} payload - to be set as payload
   * @deprecated use {@see RemoteData#success}
   * @static
   */
  static Success(payload) {
    return RemoteData.success(payload);
  }

  /**
   * Factory to create new 'Failure' RemoteData kind
   *
   * @template P
   * @template E
   *
   * @param {E} error - to be set
   * @return {RemoteData<P, E>} - remote data with error
   * @static
   */
  static failure(error) {
    return new FailureRemoteData(error);
  }

  /**
   * Remote data for Failure cases
   * @param {object} payload - to be set
   * @deprecated use @see RemoteData#failure
   * @static
   */
  static Failure(payload) {
    return RemoteData.failure(payload);
  }
}

/**
 * Remote data wrapper around a value that has not been asked yet
 *
 * @template P
 * @template E
 * @extends RemoteData<P,E>
 */
export class NotAskedRemoteData extends RemoteData {
  /**
   * @inheritDoc
   */
  match(clauses) {
    super._validateMatchClauses(clauses);
    return clauses.NotAsked ? clauses.NotAsked() : clauses.Other();
  }

  /**
   * @inheritDoc
   */
  isNotAsked() {
    return true;
  }

  /**
   * @inheritDoc
   */
  get kind() {
    return 'NotAsked';
  }
}

/**
 * Remote data wrapper around a value that is currently loading
 *
 * @template P
 * @template E
 * @extends RemoteData<P,E>
 */
export class LoadingRemoteData extends RemoteData {
  /**
   * @inheritDoc
   */
  match(clauses) {
    super._validateMatchClauses(clauses);
    return clauses.Loading ? clauses.Loading() : clauses.Other();
  }

  /**
   * @inheritDoc
   */
  isLoading() {
    return true;
  }

  /**
   * @inheritDoc
   */
  get kind() {
    return 'Loading';
  }
}

/**
 * Remote data wrapped around a value that has been successfully fetched
 *
 * @template P
 * @template E
 * @extends RemoteData<P,E>
 */
export class SuccessRemoteData extends RemoteData {
  /**
   * Constructor
   * @param {P} payload the actual data
   */
  constructor(payload) {
    super();
    this._payload = payload;
  }

  /**
   * @inheritDoc
   */
  match(clauses) {
    super._validateMatchClauses(clauses);
    return clauses.Success ? clauses.Success(this._payload) : clauses.Other();
  }

  /**
   * @inheritDoc
   */
  isSuccess() {
    return true;
  }

  /**
   * @inheritDoc
   * @return {P} the payload
   */
  get payload() {
    return this._payload;
  }

  /**
   * @inheritDoc
   */
  get kind() {
    return 'Success';
  }
}

/**
 * Remote data wrapper around the error received when trying to fetch data
 *
 * @template P
 * @template E
 * @extends RemoteData<P,E>
 */
export class FailureRemoteData extends RemoteData {
  /**
   * The errors encountered while fetching data
   * @param {E} error the error encountered while fetching data
   */
  constructor(error) {
    super();
    this._error = error;
  }

  /**
   * @inheritDoc
   */
  match(clauses) {
    super._validateMatchClauses(clauses);
    return clauses.Failure ? clauses.Failure(this._error) : clauses.Other();
  }

  /**
   * @inheritDoc
   */
  isFailure() {
    return true;
  }

  /**
   * @inheritDoc
   * @return {E} the error
   */
  get payload() {
    return this._error;
  }

  /**
   * @inheritDoc
   */
  get kind() {
    return 'Failure';
  }
}
