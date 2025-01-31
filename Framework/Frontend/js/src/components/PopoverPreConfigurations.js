/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */
import { documentClickTaggedEventRegistry } from '../utilities/documentClickTaggedEventRegistry.js';

/**
 * @type {Readonly<{click: Readonly<Partial<PopoverConfiguration>>, hover: Readonly<Partial<PopoverConfiguration>>}>}
 */
export const PopoverTriggerPreConfiguration = Object.freeze({
  click: Object.freeze({
    onTriggerNodeChange: (previousTriggerNode, newTriggerNode, popoverComponent) => {
      const hideDropdownOnEscape = (e) => e.key === 'Escape' && popoverComponent.hidePopover();
      const handleClick = (e) => {
        documentClickTaggedEventRegistry.tagEvent(e, popoverComponent.key);
        popoverComponent.togglePopover();
      };

      if (previousTriggerNode) {
        documentClickTaggedEventRegistry.removeListener(popoverComponent.hidePopover);
        window.removeEventListener('keyup', hideDropdownOnEscape);
        previousTriggerNode.removeEventListener('click', handleClick);
      }

      if (newTriggerNode) {
        newTriggerNode.addEventListener('click', handleClick);
        documentClickTaggedEventRegistry.addListenerForAnyExceptTagged(popoverComponent.hidePopover, popoverComponent.key);
        window.addEventListener('keyup', hideDropdownOnEscape);
      }
    },
    onPopoverNodeChange: (previousPopoverNode, newPopoverNode, popoverComponent) => {
      const handleClick = (e) => documentClickTaggedEventRegistry.tagEvent(e, popoverComponent.key);

      if (previousPopoverNode) {
        previousPopoverNode.removeEventListener('click', handleClick);
      }

      if (newPopoverNode) {
        newPopoverNode.addEventListener('click', handleClick);
      }
    },
  }),

  /**
   * Partial popover configuration for hover-based popover
   *
   * @type {Readonly<Partial<PopoverConfiguration>>}
   */
  hover: Object.freeze({
    onTriggerNodeChange: (previousTriggerNode, newTriggerNode, popoverComponent) => {
      if (previousTriggerNode) {
        previousTriggerNode.removeEventListener('mouseenter', popoverComponent.showPopover);
        previousTriggerNode.removeEventListener('mouseleave', popoverComponent.hidePopover);
      }

      if (newTriggerNode) {
        newTriggerNode.addEventListener('mouseenter', popoverComponent.showPopover);
        newTriggerNode.addEventListener('mouseleave', popoverComponent.hidePopover);
      }
    },
  }),
});
