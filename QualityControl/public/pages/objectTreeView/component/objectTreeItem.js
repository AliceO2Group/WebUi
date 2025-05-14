import { h, iconBarChart, iconCaretRight, iconCaretBottom } from '/js/src/index.js';

/**
 * Creates a list item for a branch (folder-like node that can be expanded/collapsed)
 * @param {ObjectTreeModel} treeModel - current tree branch
 * @param {Function} treeItems - function that receives an ObjectTreeModel and returns a vnode
 * @returns {vnode} - virtual node element
 */
export const branchItem = (treeModel, treeItems) => {
  const { name, open } = treeModel;

  return h('li.object-tree-branch', { title: name }, [
    h('div.object-selectable', { onclick: () => treeModel.toggle() }, [
      h('span', open ? iconCaretBottom() : iconCaretRight()),
      ' ',
      name,
    ]),
    open ? h('ul.object-tree-list', treeItems(treeModel)) : null,
  ]);
};

/**
 * Creates a list item for a leaf (end node that represents an object)
 * @param {object} leaf - the leaf object
 * @returns {vnode} - virtual node element
 */
export const leafItem = (leaf) => {
  const { name, path } = leaf;
  const displayName = name.split('/').pop();

  return h('li.object-tree-leaf', { key: path }, [
    h('div.object-selectable', {
      onclick: () => model.object.select(leaf),
      title: path,
    }, [
      h('span', iconBarChart()),
      ' ',
      displayName,
    ]),
  ]);
};

// /**
//  * Recursively renders tree items
//  * @param {ObjectTreeModel} treeModel - the model that controls this tree's state
//  * @param {Function} branchItem - function that receives an ObjectTreeModel and returns a vnode
//  * @param {Function} leafItem - function that receives a object and returns a vnode
//  * @returns {Array<vnode>} - array of virtual node elements
//  */
// export const treeItems = (treeModel, branchItem, leafItem) =>
//   treeModel.children.map((child) =>
//     child instanceof ObjectTreeModel
//       ? branchItem(child)
//       : leafItem(child));
