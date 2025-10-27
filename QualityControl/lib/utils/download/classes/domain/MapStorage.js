export class MapStorage {
  constructor() {
    this.layoutStorage = new Map();
  }

  layoutStorage;

  /**
   * read func
   * @param {string} key - key
   * @returns {LayoutDomainStorage | undefined} found Layout
   */
  readLayout(key) {
    return this.layoutStorage.get(key);
  }

  /**
   * write func
   * @param {LayoutDomainStorage} layout - layout
   * @returns {string} - key
   */
  writeLayout(layout) {
    const mapKey = crypto.randomUUID();
    this.layoutStorage.set(mapKey, layout);
    return mapKey;
  }

  /**
   * delete func
   * @param {string} key - key
   * @returns {boolean} - true if deleted
   */
  deleteLayout(key) {
    return this.layoutStorage.delete(key);
  }

  /**
   * delete cached layout data by user id
   * @param {number} userId - userid
   */
  deleteByUserId(userId) {
    const found = this.layoutStorage.entries().filter((entry) => entry[1].downloadUserId == userId);
    found.forEach((entry) => {
      this.layoutStorage.delete(entry[0]);
    });
  }
}
