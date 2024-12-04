import { httpGetJson } from '../utils/utils.js';

export class BookkeepingService {
  constructor({ url, token, refreshRate }) {
    this._url = url;
    const { protocol, hostname, port } = url ? new URL(this._url) : {};
    this._hostname = hostname;
    this._port = port;
    this._protocol = protocol;

    this._token = token;
    this.REFRESH_INTERVAL = refreshRate ?? 24 * 60 * 60 * 1000;

    this._runTypes = [];
  }

  /**
   * Get the list of run types that is currently known to the bookkeeping service.
   * @returns {Array<string>} - list of run types
   */
  getRunTypes() {
    return this._runTypes;
  }

  /**
   * Retrieve list of run types from the bookkeeping service
   * @returns {Promise} - resolves when the list of run types is available
   */
  async retrieveRunTypes() {
    try {
      const { data } = await httpGetJson(
        this._hostname,
        this._port,
        'api/runTypes',
        {
          protocol: this._protocol,
          rejectUnauthorized: false,
        },
      );
      for (const type of data) {
        this._runTypes.push(type.id);
      }
    } catch {
      this._runTypes = [
        'COSMICS',
        'PHYS_HI',
        'PHYS_pp',
        'SYNTHETIC',
        'TECHNICAL',
      ];
    }
  }

  /**
   * Returns the interval in milliseconds for how often the list of run types should be refreshed.
   * @returns {number} - interval in milliseconds
   */
  getRefreshInterval() {
    return this.REFRESH_INTERVAL;
  }
}
