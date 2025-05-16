import { h, iconBarChart, iconCaretRight, iconCaretBottom } from '/js/src/index.js';

/**
 * Creates a list item for a branch (folder-like node that can be expanded/collapsed)
 * @param {ObjectTreeModel} treeModel - current tree branch
 * @param {Function} treeItems - function that receives an ObjectTreeModel and returns a vnode
 * @returns {vnode} - virtual node element
 */
export const branchItem = (treeModel, treeItems) => {
  const { name, open, pathString } = treeModel;

  return h('li.object-tree-branch', { key: pathString, title: pathString, id: pathString }, [
    h('div.object-selectable', { onclick: () => treeModel.toggle() }, [
      h('span', open ? iconCaretBottom() : iconCaretRight()),
      ' ',
      name,
    ]),
    open ? h('ul.object-tree-list', treeItems(treeModel)) : null,
  ]);
};

/**
 * Creates a list item for a leafObject (end node that represents an object)
 * @param {object} leafObject - a leaf object that has a name property in the path format
 * eg. 'qc/test/object/1'
 * @param {QCObject} qcObject - object managing model
 * @returns {vnode} - virtual node element
 */
export const leafItem = (leafObject, qcObject) => {
  const { name } = leafObject;
  const displayName = name.split('/').pop();

  return h('li.object-tree-leafObject', { key: name, title: name, id: name }, [
    h('div.object-selectable', {
      onclick: () => qcObject.select(leafObject),
      title: name,
    }, [
      h('span', iconBarChart()),
      ' ',
      displayName,
    ]),
  ]);
};

/**
 * Creates a list item for a leafObject (end node that represents an object)
 * @param {object} leafObject - the leafObject object
 * @param {QCObject} qcObject - object managing model
 * @param {QCObject} layout - layout managing model
 * @returns {vnode} - virtual node element
 */
export const sideTreeLeafItem = (leafObject, qcObject, layout) => {
  const { name } = leafObject;
  const displayName = name.split('/').pop();
  const className = leafObject === qcObject.selected ? 'bg-primary white' : '';

  const attr = {
    key: name,
    title: name,
    id: name,
    className,
    onclick: () => qcObject.select(leafObject),
    draggable: true,
    ondragstart: () => {
      const newItem = layout.addItem(name);
      layout.moveTabObjectStart(newItem);
    },
    ondblclick: () => layout.addItem(name),
  };

  return h('li.object-tree-leaf', [
    h('div.object-selectable', attr, [
      h('span', iconBarChart()),
      ' ',
      displayName,
    ]),
  ]);
};
