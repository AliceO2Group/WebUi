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

const licenseText = '/**\n' +
      ' * @license\n' +
      ' * Copyright 2019-2020 CERN and copyright holders of ALICE O2.\n' +
      ' * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.\n' +
      ' * All rights not expressly granted are reserved.\n' +
      ' *\n' +
      ' * This software is distributed under the terms of the GNU General Public\n' +
      ' * License v3 (GPL Version 3), copied verbatim in the file "COPYING".\n' +
      ' *\n' +
      ' * In applying this license CERN does not waive the privileges and immunities\n' +
      ' * granted to it by virtue of its status as an Intergovernmental Organization\n' +
      ' * or submit itself to any jurisdiction.\n */\n\n';

export default {
  meta: {
    type: 'layout',
    docs: {
      description: 'All files should have CERN copyright license at the top.',
    },
    messages: {
      includeCopyrightLicense: 'All files should have CERN copyright license at the top.'
    },
    fixable: 'whitespace',
    schema: [],
    hasSuggestions: false
  },
  create: function (context) {
    return {
      Program: function(node) {
        const sourceText = context.sourceCode.getText();
        if (sourceText.startsWith(licenseText)) return;
        context.report({
          node,
          messageId: 'includeCopyrightLicense',
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
          fix(fixer) {
            return fixer.insertTextBefore(node, licenseText);
          }
        });
      } 
    };
  },
};
