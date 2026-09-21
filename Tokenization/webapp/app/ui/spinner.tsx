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

interface SpinnerProps {
  /**
   * Size of the spinner in rem, default 10
   */
  size?: number;

  /**
   * Horizontal alignment of the spinner, default 'center'
   */
  align?: 'left' | 'center' | 'right';
}

/**
 * Renders animated spinner
 *
 * @param size
 * @param align
 */
export const Spinner = ({ size = 10, align = 'center' }: SpinnerProps) => <div className={`flex-row justify-${align} items-center`}>
  <div style={{ fontSize: `${size}rem` }}>
    <div className={'atom-spinner'}>
      <div className={'spinner-inner'}>
        <div className={'spinner-line'}></div>
        <div className={'spinner-line'}></div>
        <div className={'spinner-line'}></div>
        <div className={'spinner-circle'}>
          <div>●</div>
        </div>
      </div>
    </div>
  </div>
</div>;
