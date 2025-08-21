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

import type { Log } from '~/components/logs/log';

interface TokenLogsProps {
  logs: Log[];
}

/**
 * Displays log entries associated with a token in a table format.
 * Shows a "no logs" message when the logs array is empty.
 *
 * @param logs - Array of log entries to display
 */
export const TokenLogs = ({ logs }: TokenLogsProps) => {
  if (logs.length === 0) {
    return <p><em>No logs linked to this token</em></p>;
  }
  return <table className={'table'}>
    <thead>
      <tr>
        <th>Title</th>
        <th>Content</th>
      </tr>
    </thead>
    <tbody>
      {logs.map(({ id, title, content }) => <tr key={id}>
        <td>{title}</td>
        <td>{content}</td>
      </tr>)}
    </tbody>
  </table>;
};
