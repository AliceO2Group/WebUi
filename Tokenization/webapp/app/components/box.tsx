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

import React from 'react';
import { Link } from 'react-router';
import { IconContainer, IconExpandRight } from '~/ui/icon';

interface BoxInterface {
  children: React.ReactNode;
  link: string | null;
}

interface PrimaryBoxInterface extends BoxInterface {
  className_div1: string;
  className_div2: string;
}
/**
 * Box component - container which renders a content inside.
 *
 * TODO: On PC it will stand in grid layout on mobile will lay basing on display flex with wrap
 * For now it uses grid only.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Content rendered inside the box.
 * @param {string|null} props.link - Passing this prop to the component enables rendering of the top bar
 * with an icon that navigates the user to the corresponding details page.
 * @param {string} props.className_div1 - Additional classes applied to the outer container.
 * @param {string} props.className_div2 - Additional classes applied to the top link row container.
 */
export function Box({ children, link, className_div1, className_div2 }: PrimaryBoxInterface) {
  return (
    <div className={`bg-gray m3 ${className_div1}`}>
      {link && <div className={`flex-row justify-center ${className_div2}`}>
        <div className="w-90 flex-row justify-end">
          <Link to={link}>
            <IconContainer className="scale15 actionable-icon">
              <IconExpandRight />
            </IconContainer>
          </Link>
        </div>
      </div>
      }
      {children}
    </div>
  );
}

/**
 * Box 1_2 component - renders box with padding suited for grid with 1 row and 2 columns.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Content rendered inside the box.
 * @param {string|null} props.link - Passing this prop to the component enables rendering of the top bar
 * with an icon that navigates the user to the corresponding details page.
 */
export function Box1_2 ({ children, link }: BoxInterface) {
  return (
    <Box
      link={link}
      className_div1="min-height-box-1"
      className_div2="mv3"
    >
      <div className="flex-row justify-center">
        <div className="w-95">
          {children}
        </div>
      </div>
    </Box>
  );
}

/**
 * Box 1_2 component - renders box with padding suited for grid with 1 row and 1 column.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Content rendered inside the box.
 * @param {string|null} props.link - Passing this prop to the component enables rendering of the top bar
 * with an icon that navigates the user to the corresponding details page.
 */
export function Box1_1 ({ children, link }: BoxInterface) {
  return (
    <Box
      link={link}
      className_div1="min-height-box-1"
      className_div2="mv4"
    >
      <div className='p4'>
        <div className='mv2'></div>
        {children}
      </div>
    </Box>
  );
}
