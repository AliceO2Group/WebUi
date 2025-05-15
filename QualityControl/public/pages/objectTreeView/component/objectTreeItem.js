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
 * @param {object} leafObject - the leaf object
 * @returns {vnode} - virtual node element
 */
export const leafItem = (leafObject) => {
  const { name } = leafObject;
  const displayName = name.split('/').pop();

  return h('li.object-tree-leafObject', { key: name, title: name, id: name }, [
    h('div.object-selectable', {
      onclick: () => model.object.select(leafObject),
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
 * @returns {vnode} - virtual node element
 */
export const sideTreeLeafItem = (leafObject) => {
  const { name } = leafObject;
  const { object, layout } = model;
  const displayName = name.split('/').pop();
  const className = leafObject === object.selected ? 'bg-primary white' : '';

  const attr = {
    key: name,
    title: name,
    id: name,
    className,
    onclick: () => object.select(leafObject),
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
