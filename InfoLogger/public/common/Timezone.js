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

/* global moment */

import {Observable} from '/js/src/index.js';

export const TIME_MS = 'time-ms';
export const TIME_S = 'time-s';
/**
 * Parses inputs from user and format datetimes to timzeone selected
 * @param {Object} model
 * @return {vnode}
 */
export default class Timezone extends Observable {
  /**
   * Instanciate with timezone to Geneva (Europe/Zurich)
   */
  constructor() {
    super();

    this.current = 'Europe/Zurich';
    this.local = false;
  }

  /**
   * Set timezone to Geneva
   */
  setGeneva() {
    this.current = 'Europe/Zurich';
    this.local = false;
    this.notify();
  }

  /**
   * Set timezone to local (user's PC)
   */
  setLocal() {
    this.current = moment.tz.guess(); // might be Geneva!
    this.local = true;
    this.notify();
  }

  /**
   * Parse a human date string and returns a javascript Date, default date is now
   * See datePicker.js for allowed inputs
   * [DD/[MM[/YYYY]]] = > absolute day midnight
   * [hh:[mm[:ss[.mmm]]] = > absolute time
   * [N]d] => relative days
   * [N]h] => relative hours
   * [N]m] => relative minutes
   * [N]s] => relative seconds
   * 2/9/12 => 20:00 2nd Septembre 2012, 8pm
   * 2/ 20: => 2nd of this month, 8pm
   * 1d 6:00 => yesterday at 6am
   * 5m => five minutes ago
   * @param {string} humanString - Eg: "-5m" means five minutes ago
   * @param {string} tz - optional timezone
   * @return {date} the parsed date or null if empty
   */
  parse(humanString, tz) {
    if (!humanString) {
      return null;
    }

    tz = tz || this.current;

    const date = moment().tz(tz); // let's begin by 'now' and modify it according to regexes

    // Array of regex to find something to parse with their setters on Date object.
    // Must follow the same pattern, only last letter change.
    // +- mandatory
    // number optional
    // space optional
    // first letter of modifier
    // rest of the modifier optional (m means minutes)
    const relatives = [
      {
        reg: /([-+])([0-9]*)\s?s/i,
        setter: 'seconds',
        getter: 'seconds'
      },
      {
        reg: /([-+])([0-9]*)\s?m/i,
        setter: 'minutes',
        getter: 'minutes'
      },
      {
        reg: /([-+])([0-9]*)\s?h/i,
        setter: 'hours',
        getter: 'hours'
      },
      {
        reg: /([-+])([0-9]*)\s?d/i,
        setter: 'date',
        getter: 'date'
      }
    ];

    // Absolute: [DD/[MM[/YYYY]]] and set hour to midnight

    const regDate = /([0-9]+)\/(([0-9]+)(\/([0-9]+)(\/([0-9]+))?)?)?/i;
    const regDateResult = regDate.exec(humanString);
    if (regDateResult) {
      date.date(parseInt(regDateResult[1], 10)); // mandatory day
      if (regDateResult[3]) { // optional month
        date.month(parseInt(regDateResult[3], 10) - 1); // zero-based
      }
      if (regDateResult[5]) { // optional year
        let newYear = parseInt(regDateResult[5], 10); // zero-based
        if (newYear < 100) { // 20 => 2020
          newYear += 2000;
        }
        date.year(newYear);
      }

      // Midnight of this day
      date.hours(0);
      date.minutes(0);
      date.seconds(0);
      date.milliseconds(0);
    }

    // Absolute: [hh:[mm[:ss[.mmm]]] and keep the day previously set

    const regTime = /([0-9]+):(([0-9]*)(:([0-9]*)(\.([0-9]*))?)?)?/i;
    const regTimeResult = regTime.exec(humanString);
    if (regTimeResult) {
      date.hours(parseInt(regTimeResult[1], 10));
      date.minutes(parseInt(regTimeResult[3] || 0, 10)); // set zero if not set
      date.seconds(parseInt(regTimeResult[5] || 0, 10));
      date.milliseconds(parseInt(regTimeResult[7] || 0, 10));
    }

    // Apply relative changes (eg: +- 5 minutes)

    for (let i = 0, relative; relative = relatives[i]; i++) {
      const regResult = relative.reg.exec(humanString);
      if (regResult) {
        const sign = regResult[1]; // sign is mandatory
        const number = parseInt(regResult[2] || 1, 10); // empty means one in human language

        // Change the date by the amount given by user
        // Javascript will handle well if the numbers are too big
        // Example: -65m ~=> -1h -5m
        if (sign === '-') {
          date[relative.setter](date[relative.getter]() - number);
        } else {
          date[relative.setter](date[relative.getter]() + number);
        }
      }
    }

    return date.toDate();
  }

  /**
   * Generate a datetime representation string (compatible with parser)
   * @param {number|string|date} timestamp - 1456135200002.017
   * @param {string} format - 'datetime' or 'date' or 'time'
   * @param {string} tz - optional timezone normalized like 'Europe/Zurich'
   * @return {string} dd/mm/yyyy HH:MM:SS.mmm
   */
  format(timestamp, format, tz) {
    if (typeof timestamp === 'string') {
      timestamp = parseFloat(timestamp);
    }

    if (typeof timestamp === 'number') {
      timestamp = timestamp * 1000; // seconds to ms
    }

    tz = tz || this.current;

    if (format === 'datetime') {
      // zz is the timezone like 'Europe/Zurich', CET (Central European Time), CEST, etc.
      return moment(timestamp).tz(tz).format('DD/MM/GGGG HH:mm:ss.SSS zz');
    } else if (format === 'date') {
      return moment(timestamp).tz(tz).format('DD/MM/GGGG');
    } else if (format === TIME_MS) {
      return moment(timestamp).tz(tz).format('HH:mm:ss.SSS');
    } else {// TIME_S
      return moment(timestamp).tz(tz).format('HH:mm:ss');
    }
  }

  /**
   * Compute how much time since the date passed in argument
   * @param {Date} startingDate
   * @return {string} example: 1:12:45
   */
  formatDuration(startingDate) {
    const elapsedSeconds = ((new Date()) - startingDate) / 1000;
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor(elapsedSeconds % 3600 / 60);
    const seconds = Math.floor(elapsedSeconds % 3600 % 60);
    let output = '';

    if (hours) {
      output = hours + ':';
    }

    if (minutes > 9) {
      output += minutes + ':';
    } else {
      output += '0' + minutes + ':';
    }

    if (seconds > 9) {
      output += seconds;
    } else {
      output += '0' + seconds;
    }

    return output;
  }
}
