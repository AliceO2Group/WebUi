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

export interface ReconnectionOptions {
  initialDelay?: number; // Initial delay in ms
  maxDelay?: number; // Maximum delay in ms
}

/**
 * Logger interface matching @aliceo2/web-ui LogManager logger
 */
interface Logger {
  infoMessage(message: string, ...args: any[]): void;
  errorMessage(message: string, ...args: any[]): void;
  warnMessage(message: string, ...args: any[]): void;
  debugMessage(message: string, ...args: any[]): void;
}

/**
 * A scheduler that manages reconnection attempts with an exponential backoff.
 */
export class ReconnectionScheduler {
  private reconnectCallback: any;
  private initialDelay: number;
  private maxDelay: number;
  private currentDelay: number;
  private attemptCount: number;
  private timeoutId: any;
  private logger: Logger;

  private isScheduling: boolean = false;

  /**
   * Creates a new instance of the ReconnectionScheduler.
   * @param {any} reconnectCallback - The callback to be called when a reconnection attempt is scheduled.
   * @param {ReconnectionOptions} [options] - Options for the reconnection schedule.
   * @param {Logger} logger - The logger instance to be used for logging messages.
   */
  constructor(reconnectCallback: any, options: ReconnectionOptions = {}, logger: Logger) {
    this.reconnectCallback = reconnectCallback;
    this.initialDelay = options.initialDelay ?? 1000;
    this.maxDelay = options.maxDelay ?? 30000;

    this.currentDelay = this.initialDelay;
    this.attemptCount = 0;
    this.timeoutId = null;

    this.logger = logger;
  }

  /**
   * Schedules the next reconnection attempt using exponential backoff.
   */
  schedule() {
    if (this.isScheduling) return;
    this.isScheduling = true;
    this.attemptCount++;

    // Exponential backoff calculation
    const delay = this.initialDelay * Math.pow(2, this.attemptCount);

    this.currentDelay = Math.min(this.maxDelay, delay);

    this.logger.infoMessage(`Reconnection attempt #${this.attemptCount}: Sleep for ${this.currentDelay.toFixed(0)} ms.`);

    // Plan the reconnection attempt
    this.timeoutId = setTimeout(() => {
      this.isScheduling = false;
      this.reconnectCallback();
    }, this.currentDelay);
  }

  /**
   * Resets the scheduler to its initial state.
   */
  reset() {
    this.isScheduling = false;
    clearTimeout(this.timeoutId);
    this.attemptCount = 0;
    this.currentDelay = this.initialDelay;
  }
}
