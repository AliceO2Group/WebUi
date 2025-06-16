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

import {IconHome, IconCog} from '../icon'
import { Link } from 'react-router'

/**
 * AppHeader
 *
 * Displays the application header with navigation icons (home, settings) and a customizable title.
 *
 * @param headerContent Optional string to display as the header title.
 */
export function AppHeader({headerContent}: {headerContent?: string}) {
    return (
        <div className={"flex-row justify-center mv4 g4"} style={{ gridColumn: "span 2", justifySelf: "stretch"}}>
            
            <Link to="/">
                <div className="mv4 mh4" style={{transform: "scale(2.5)"}}>
                    <IconHome/>
                </div>
            </Link>
            <Link to="/settings">
                <div className="mv4 mh4" style={{transform: "scale(2.5)"}}>
                    <IconCog />
                </div>
            </Link>

            <header className="bg-gray flex-row justify-end w-80 ph3">
                <h1>{headerContent ? headerContent: "Tokenization Admin Interface"}</h1>
            </header>

        </div>
        )
}