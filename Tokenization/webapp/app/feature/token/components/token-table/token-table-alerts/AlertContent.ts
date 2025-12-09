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

export const ALERT_UNBANNED_FAULT = {
  title: 'Token(s) unban failed!',
  message: 'An error occurred while unbanning the token.',
  success: false,
};

export const ALERT_BANNED_FAULT = {
  title: 'Token(s) ban failed',
  message: 'An error occurred while banning the token.',
  success: false,
};

export const ALERT_UNBANNED_SUCCESS = {
  title: 'Token unbanned successfully',
  message: 'The token has been unbanned successfully.',
  success: true,
};

export const ALERT_BANNED_SUCCESS = {
  title: 'Token banned successfully',
  message: 'The token has been banned successfully.',
  success: true,
};
