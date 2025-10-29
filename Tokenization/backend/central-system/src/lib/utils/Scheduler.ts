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

import { LogManager } from "@aliceo2/web-ui";

const logger = LogManager.getLogger("utils/Scheduler");

type Key = string;

export type ScheduledJobs = Map<Key, NodeJS.Timeout>;

export class ArchiveScheduler {
  private jobs: ScheduledJobs = new Map();

  private key(tokenId: number, method: string): Key {
    return `${tokenId}:${method}`;
  }

  /** Schedule a job to run after delayMs milliseconds. */
  schedule(
    tokenId: number,
    method: string,
    delayMs: number,
    run: () => Promise<void>
  ): () => void {
    const k = this.key(tokenId, method);

    // prevent duplicates
    this.cancel(tokenId, method);

    const t = setTimeout(() => {
      this.jobs.delete(k);
      run().catch((err) => {
        logger.errorMessage(
          `Scheduled job for token ${tokenId} method ${method} failed: ${err}`
        );
      });
    }, delayMs);

    this.jobs.set(k, t);
    return () => this.cancel(tokenId, method);
  }

  /** Cancel a scheduled job. */
  cancel(tokenId: number, method: string): void {
    const k = this.key(tokenId, method);
    const t = this.jobs.get(k);
    if (t) {
      clearTimeout(t);
      this.jobs.delete(k);
    }
  }

  /** Cancel all on shutdown. */
  cancelAll(): void {
    for (const [, t] of this.jobs) clearTimeout(t);
    this.jobs.clear();
  }
}
