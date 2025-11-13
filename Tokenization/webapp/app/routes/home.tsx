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
import { Link } from 'react-router';

import { useSetHeader } from '~/ui/header/headerContext';

/**
 * Home page component for the Tokenization Admin Interface.
 * Sets the page header and provides navigation to the tokens overview.
 */
export default function Home() {

  useSetHeader('Tokenization Admin Interface');

  return <>
    <h1>Welcome to (dummy) Tokenization GUI!</h1>
    <Link to={'/tokens'}>Tokens overview</Link>

  </>;
}
