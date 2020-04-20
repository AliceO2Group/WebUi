import {h} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';

/**
 * Create a selection area for all FLPs from consul
 * @param {Object} workflow
 * @return {vnode}
 */
export default (workflow) =>
  h('.w-100.p2.panel',
    workflow.flpList.match({
      NotAsked: () => null,
      Loading: () => pageLoading(2),
      Success: (list) => flpSelectionArea(list, workflow),
      Failure: () => h('.f7.flex-column', [
        h('', 'FLP Selection is currently disabled due to connection refused to Consul.'),
        h('', ' Please use `environment variables` panel to select your FLP Hosts')
      ]),
    })
  );

/**
 * Display an area with selectable elements
 * @param {Array<string>} list
 * @param {Object} workflow
 * @return {vnode}
 */
const flpSelectionArea = (list, workflow) =>
  h('.w-100.m1.text-left.shadow-level1.scroll-y', {
    style: 'max-height: 25em;'
  }, [
    list.map((name) =>
      h('a.menu-item', {
        className: workflow.form.hosts.indexOf(name) >= 0 ? 'selected' : null,
        onclick: () => workflow.toggleFLPSelection(name)
      }, name)
    ),
  ]);
