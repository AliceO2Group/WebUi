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

import type React from 'react';
import { type PropsWithChildren } from 'react';
import { type DialogPropsBase as DPB } from '~/utils/types';

export interface WindowElements {
  title: React.ReactElement;
  content: React.ReactElement;
  buttonCancel: React.ReactElement;
  buttonAccept: React.ReactElement;
  closeIcon: React.ReactElement;
}

export interface WindowElementsWithAction extends WindowElements {
  acceptAction: () => void;
  cancelAction: () => void;
}

export interface WindowInterface extends PropsWithChildren, React.HTMLAttributes<HTMLDivElement>, DPB {
  onOpen?: () => void;
  onClose?: () => void;
  timeout?: number | null;
}

export interface ButtonInterface extends PropsWithChildren, React.ButtonHTMLAttributes<HTMLButtonElement> {
  action?: () => void;
}
