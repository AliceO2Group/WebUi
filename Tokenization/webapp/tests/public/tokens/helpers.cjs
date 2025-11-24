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

async function selectReactOption(reactSelect, optionIndex) {
  await reactSelect.click();
  await setTimeout(() => {}, 100);
  return reactSelect.$(`ul li:nth-child(${optionIndex})`);
}

async function fillNumberInput(inputElement, number) {
  return inputElement.type(number.toString());
}

async function fillAllFormFields(page, reactSelect1, reactSelect2, reactSelect3, expirationInput, button) {
  const opt1 = await selectReactOption(reactSelect1, 1);
  await opt1.click();
  const select1Content = (await opt1.evaluate(el => el.textContent)).trim();

  const opt2 = await selectReactOption( reactSelect2, 2);
  await opt2.click();
  const select2Content = (await opt2.evaluate(el => el.textContent)).trim();

  const opt3 = await selectReactOption(reactSelect3, 1);
  await opt3.click();
  const select3Content = (await opt3.evaluate(el => el.textContent)).trim();

  const filledNumber = 10;
  await fillNumberInput(expirationInput, filledNumber);
  await button.click();

  const dialogHandle = await page.waitForSelector('.modal');
  const dialogContent = (await dialogHandle.evaluate(el => el.textContent)).trim();

  return {
    dialogHandle,
    dialogContent,
    select1Content,
    select2Content,
    select3Content,
    filledNumber,
  };
}

module.exports = {
  selectReactOption,
  fillNumberInput,
  fillAllFormFields,
};
