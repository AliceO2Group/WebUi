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

/*
 * The Framework expects Mithril to set window.m, but once bundled
 * Vite provides a fake module object and the condition in `mithril.min.js` means it just exports itself.
 * So the alias in vite.config.mjs points the Framework's import here and the global is set explicitly.
 */
import m from 'mithril';

window.m = m;
