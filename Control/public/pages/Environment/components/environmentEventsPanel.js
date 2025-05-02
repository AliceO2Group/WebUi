/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

import { h } from '/js/src/index.js';
import { ALIECS_TRANSITION_COLOR } from './../../../common/constants/stateColors.js';
/**
 * Groups events by consecutive transition categories
 * @param {{message: string, transition: object}[]} events - the events to be grouped
 * @return {Array<{category: string, events: object[]}>} - grouped events
 */
const groupEventsByConsecutiveCategory = (events = []) => {
  const groupedEvents = [];
  let currentGroup = null;

  events.forEach((event) => {
    const category = event.transition?.name || 'N/A';

    if (!currentGroup || currentGroup.category !== category) {
      // Start a new group if the category changes
      currentGroup = { category, events: [] };
      groupedEvents.push(currentGroup);
    }

    currentGroup.events.push(event);
  });

  return groupedEvents;
};

/**
 * Builds panel which contains a visual representation of all events that were received for that particular environment
 * @param {{id: string, message: string, transition: object}[]} events - the events to be displayed
 * @return {vnode} - html table with the environment configuration
 */
export const environmentEventsPanel = (events = []) => {
  const reversedEvents = [...events].reverse();
  if (!reversedEvents || reversedEvents.length === 0) {
    return h('.m2', [
      h('h5', 'No events available'),
    ]);
  }
  const groupedEvents = groupEventsByConsecutiveCategory(reversedEvents);
  return groupedEvents.map((group) => {
    const { category, events } = group;
    const transitionClass = ALIECS_TRANSITION_COLOR[category] ? `bg-${ALIECS_TRANSITION_COLOR[category]}` : '';
    return h('', [
      h(`h5.white.${transitionClass}.ph2`, `Transition: ${category}`),
      h('.w-100.m2', events.map(eventRow))
    ]);
  });
};

/**
 * Builds a row for the event table
 * @param {{message: string, transition: object, timestamp: number}} event - the event to be displayed
 * @return {vnode} - html table with the environment configuration
 */
const eventRow = (event) => {
  const { message, transition, timestamp } = event;
  return h('', [
    transition.step 
      ? h('.mh4', `[${new Date(timestamp).toISOString()}] At step: ${transition.step} and has ${event.message}`)
      : h('', `[${new Date(timestamp).toISOString()}] ${transition.name} ${message} `),
  ]);
};
