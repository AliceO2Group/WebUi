// TODO
// Change validator to different classes/types defined on server and client side
/*
class Layout {
  constructor(obj) {
    if (!this.foo) throw new Error('wrong');

    this.foo = obj.foo;
    this.bar = obj.bar;
    this.baz = obj.baz;
  }
}

*/


/**
 * Validate fields and types of argument `obj` if it is a layout, returns error message or null.
 * @param {object} obj - blabla
 * @return {string|null} result
 */
module.exports.layout = (obj) =>
  !obj ? 'object needed' :
  !obj.name ? 'name is required' :
  !obj.owner_id ? 'owner_id is required' :
  typeof obj.owner_id !== 'number' ? 'owner_id must be a number' :
  !obj.owner_name ? 'owner_name is required' :
  !obj.tabs ? 'tabs is required' :
  !Array.isArray(obj.tabs) ? 'tabs must be an array' :
  null;

