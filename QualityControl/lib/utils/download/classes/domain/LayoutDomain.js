export class LayoutDomain {
  /**
   * constructor
   * @param {string} id - id
   * @param {string} name - name
   * @param {TabDomain[]} tabs - tabs
   */
  constructor(id, name, tabs) {
    this.id = id,
    this.name = name,
    this.tabs = tabs;
  }

  id;

  name;

  tabs;
}
