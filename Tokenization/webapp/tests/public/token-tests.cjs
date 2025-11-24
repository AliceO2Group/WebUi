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

const assert = require('assert');

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

describe('token creation unsuccessful', function() {
  let url;
  let page;

  before(async function() {
    ({ page, helpers: { url } } = test);
  });

  beforeEach(async function() {
    await page.goto(`${url}/tokens/new`);

    const [
      reactSelect1,
      reactSelect2,
      reactSelect3,
      expirationInput,
      button,
    ] = await Promise.all([
      page.waitForSelector('#first-service-select'),
      page.waitForSelector('#second-service-select'),
      page.waitForSelector('#http-select-methods'),
      page.waitForSelector('.my-input > input[type="number"]'),
      page.waitForSelector('button[type="submit"]'),
    ]);

    this.reactSelect1 = reactSelect1;
    this.reactSelect2 = reactSelect2;
    this.reactSelect3 = reactSelect3;
    this.expirationInput = expirationInput;
    this.button = button;
  });

  it('Not filling form shows error alert', async function() {
    const alert = await page.waitForSelector('.alert');
    const alertClass1 = await page.$eval('.alert', el => el.className);
    assert.ok(alertClass1.includes('d-none')); // alert is hidden initially
    
    await this.button.click();
    const alertClass2 = await page.$eval('.alert', el => el.className);
    assert.ok(alertClass2.includes('d-block')); // alert is shown after submit
  });

  describe('filling partially the form', function() {
    it('error alert shows exp-time and HTTP methods are missing', async function() {
      const opt1 = await selectReactOption(this.reactSelect1, 1);
      await opt1.click();
      const opt2 = await selectReactOption(this.reactSelect2, 2);
      await opt2.click();

      await this.button.click();
      const alertContent = await page.$eval('.alert', el => el.textContent);
      assert.ok(alertContent.includes('Expiration time', 'HTTP methods'));
    });

    it('error alert shows first service and HTTP methods are missing', async function() {
      const opt2 = await selectReactOption(this.reactSelect2, 2);
      await opt2.click();
      await fillNumberInput(this.expirationInput, 10);

      await this.button.click();
      const alertContent = await page.$eval('.alert', el => el.textContent);
      assert.ok(alertContent.includes('First service', 'HTTP methods'));
    });

    it('error alert shows First service, Second service and Exp-time are missing', async function() {
      const opt3 = await selectReactOption(this.reactSelect3, 1);
      await opt3.click();

      await this.button.click();
      const alertContent = await page.$eval('.alert', el => el.textContent);
      assert.ok(
        alertContent.includes('First service', 'Second service', 'Expiration time'),
      );
    });
  });

  it('filling the form correctly shows proper success message on modal window', async function() {
    const { dialogContent, select1Content, select2Content, select3Content, filledNumber } =
      await fillAllFormFields(page, this.reactSelect1, this.reactSelect2, this.reactSelect3, this.expirationInput, this.button);
    console.log(dialogContent, select1Content, select2Content, select3Content, filledNumber
    )
      assert.ok(dialogContent.includes('Confirm Token Creation'));
    assert.ok(dialogContent.includes('Service from: ' + select1Content));
    assert.ok(dialogContent.includes('Service to: ' + select2Content));
    assert.ok(dialogContent.includes(select3Content));
    assert.ok(dialogContent.includes('Expiration time: ' + filledNumber.toString() + ' hours'));
  });

  it('no auth error shows alert', async function() {
    const { dialogHandle } = await fillAllFormFields(
      page, this.reactSelect1, this.reactSelect2, this.reactSelect3, this.expirationInput, this.button,
    );
    const confirmButton = await dialogHandle.$('button:nth-child(2)');
    await confirmButton.click();

    const alertContent = await page.$eval('.alert', el => el.textContent);
    assert.ok(alertContent.includes('Authorization error'));
  })
});
