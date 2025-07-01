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

import type { Run } from '../../components/runs/run';
import type { Route } from './+types/overview';
import { Link } from 'react-router';

export const clientLoader = async (): Promise<Run[]> => {
  const response = await fetch('http://localhost:8080/api/runs');
  if (!response.ok) {
    throw new Error('An error occurred!');
  }
  return response.json() as Promise<Run[]>;
};

/**
 * Overview component
 * @param {React.FC.Props} props React props pbject
 * @returns {ReactElement} Overview
 */
export default function Overview({ loaderData: runs }: Route.ComponentProps) {
  return (
    <>
      <h1>Runs</h1>
      <table className={'table'}>
        <thead>
          <tr>
            <th>Run number</th>
            <th>Quality</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.runNumber}>
              <td>
                <Link to={`/runs/${run.runNumber}`}>{run.runNumber}</Link>
              </td>
              <td className={run.quality === 'bad' ? 'danger' : ''}>{run.quality}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
