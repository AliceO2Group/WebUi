/**
 * RemoteData is a immutable union type representing a state
 * and its associated data for remote data loaded via network.
 */
export default class RemoteData {
  /**
   * Use factories insteed of constructor
   */
  constructor(state, payload) {
    if (state !== RemoteData.NOT_ASKED &&
        state !== RemoteData.LOADING &&
        state !== RemoteData.SUCCESS &&
        state !== RemoteData.FAILURE) {
      throw new Error('Wrong RemoteData state');
    }
    this.state = state;

    if (state !== RemoteData.SUCCESS &&
        state !== RemoteData.FAILURE &&
        payload) {
      throw new Error('RemoteData payload only available on Success and Failure');
    }
    this.payload = payload;
  }

  getState() {
    return this.state;
  }

  getPayload() {
    if (this.state === RemoteData.NOT_ASKED ||
        this.state === RemoteData.LOADING) {
      throw new Error('Payload of RemoteData must not be read in NOT_ASKED and LOADING states');
    }
    return this.payload;
  }

  isNotAsked() {
    return this.state === RemoteData.NOT_ASKED;
  }

  isLoading() {
    return this.state === RemoteData.LOADING;
  }

  isSuccess() {
    return this.state === RemoteData.SUCCESS;
  }

  isFailure() {
    return this.state === RemoteData.FAILURE;
  }
}

/**
 * Constant state representing a NOT_ASKED
 * @constant
 * @memberof RemoteData
 * @static
 */
RemoteData.NOT_ASKED = 'NOT_ASKED';

/**
 * Constant state representing a LOADING
 * @constant
 * @memberof RemoteData
 * @static
 */
RemoteData.LOADING = 'LOADING';

/**
 * Constant state representing a SUCCESS
 * @constant
 * @memberof RemoteData
 * @static
 */
RemoteData.SUCCESS = 'SUCCESS';

/**
 * Constant state representing a FAILURE
 * @constant
 * @memberof RemoteData
 * @static
 */
RemoteData.FAILURE = 'FAILURE';

/**
 * Factory to create new 'NotAsked' RemoteData state
 * @function
 * @memberof RemoteData
 * @static
 */
RemoteData.NotAsked = () => new RemoteData(RemoteData.NOT_ASKED);

/**
 * Factory to create new 'Loading' RemoteData state
 * @function
 * @memberof RemoteData
 * @static
 */
RemoteData.Loading = () => new RemoteData(RemoteData.LOADING);

/**
 * Factory to create new 'Success' RemoteData state
 * @function
 * @memberof RemoteData
 * @static
 */
RemoteData.Success = (payload) => new RemoteData(RemoteData.SUCCESS, payload);

/**
 * Factory to create new 'Failure' RemoteData state
 * @function
 * @memberof RemoteData
 * @static
 */
RemoteData.Failure = (payload) => new RemoteData(RemoteData.FAILURE, payload);
