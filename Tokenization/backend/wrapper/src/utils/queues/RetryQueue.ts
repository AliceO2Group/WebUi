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

export type RetryTaskFn<T> = () => Promise<T>;

export interface RetryTask<T = any> {
  id: string;
  tryNo: number;
  createdAt: number;
  lastRunAt?: number;
  reason?: string;
  exec: RetryTaskFn<T>;
  resolve: (v: T) => void;
  reject: (e: any) => void;
}

export interface RetryQueueOptions {
  maxRetries?: number; // default 5
  baseDelayMs?: number; // default 300
  maxDelayMs?: number; // default 8000
  jitter?: boolean; // default true
}

export class RetryQueue {
  private q: RetryTask[] = [];
  private running = false;
  private opts: Required<RetryQueueOptions>;

  /**
   * @description Creates a new RetryQueue instance.
   * @param {RetryQueueOptions} [opts] - Optional configuration options
   * @property {number} [opts.maxRetries] - Max number of retries (default 5)
   * @property {number} [opts.baseDelayMs] - Base delay in ms (default 300)
   * @property {number} [opts.maxDelayMs] - Max delay in ms (default 8000)
   * @property {boolean} [opts.jitter] - Whether to use jitter in delay calculation (default true)
   */
  constructor(opts?: RetryQueueOptions) {
    this.opts = {
      maxRetries: opts?.maxRetries ?? 5,
      baseDelayMs: opts?.baseDelayMs ?? 300,
      maxDelayMs: opts?.maxDelayMs ?? 8000,
      jitter: opts?.jitter ?? true,
    };
  }

  /**
   * @description Returns the number of tasks currently in the retry queue.
   * @returns The number of tasks in the retry queue.
   */
  public size(): number {
    return this.q.length;
  }

  /**
   * @description Adds a task to the retry queue. The task will be executed after a delay.
   * @param {RetryTask<T>} task - The task to be added to the retry queue.
   * @template T - The type of the data returned by the task.
   */
  public enqueue<T>(task: RetryTask<T>) {
    this.q.push(task);
    // we don't start the task – exec will be called after delay or drainNow
    this.schedule(task);
  }

  /**
   * Drains the retry queue by executing all the tasks currently in the queue immediately.
   *
   * @remarks
   * This method is particularly useful when a condition changes that makes all pending
   * tasks likely to succeed (e.g., a new authentication token is received). It:
   *
   * 1. **Prevents concurrent draining**: Returns early if already running to avoid race conditions
   * 2. **Clears the queue atomically**: Takes a snapshot of all tasks and clears the queue
   * 3. **Executes all tasks immediately**: Bypasses the exponential backoff delay
   * 4. **Handles failures gracefully**: Failed tasks are re-enqueued with incremented retry count
   * 5. **Respects retry limits**: Tasks exceeding maxRetries are rejected
   *
   * @example
   * ```typescript
   * // When a new token is received, drain all pending requests
   * connection.handleNewToken(newToken);
   * retryQueue.drainNow(); // All queued requests will retry immediately
   * ```
   */
  public drainNow() {
    if (this.running) return;
    this.running = true;
    const tasks = [...this.q];
    this.q = [];
    for (const t of tasks) {
      t.exec()
        .then(t.resolve)
        .catch((e) => {
          // if failed, re-enqueue with incremented tryNo
          t.tryNo++;
          if (t.tryNo > this.opts.maxRetries) {
            t.reject(e);
            return;
          }
          this.enqueue(t);
        });
    }
    this.running = false;
  }

  /**
   * Schedules a task to be executed after an exponential backoff delay.
   *
   * @remarks
   * This method implements a sophisticated retry strategy with the following features:
   *
   * **Exponential Backoff Calculation:**
   * - Base formula: `delay = baseDelayMs * 2^tryNo`
   * - Capped at maxDelayMs to prevent excessive wait times
   * - Example with baseDelayMs=300ms: 300ms → 600ms → 1200ms → 2400ms → 4800ms
   *
   * **Jitter (Optional):**
   * - Adds randomness to prevent thundering herd problem
   * - Random multiplier between 0.5 and 1.0
   * - Helps distribute retry attempts across time
   *
   * **Automatic Re-scheduling:**
   * - Failed tasks are automatically re-enqueued with incremented tryNo
   * - Tasks exceeding maxRetries are rejected with the last error
   * - Successful tasks resolve their original promise
   *
   * @param task - The task to be scheduled with retry metadata
   *
   * @example
   * ```typescript
   * // Task will be retried with delays: 300ms, 600ms, 1200ms, 2400ms, 4800ms
   * const queue = new RetryQueue({ baseDelayMs: 300, maxRetries: 5 });
   * ```
   */
  private schedule(task: RetryTask) {
    const { baseDelayMs, maxDelayMs, jitter } = this.opts;
    const exp = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, task.tryNo));
    const delay = jitter ? Math.floor(exp * (0.5 + Math.random())) : exp;

    setTimeout(() => {
      task.lastRunAt = Date.now();
      task
        .exec()
        .then(task.resolve)
        .catch((e) => {
          task.tryNo++;
          if (task.tryNo > this.opts.maxRetries) {
            task.reject(e);
            return;
          }
          this.enqueue(task);
        });
    }, delay);
  }
}
