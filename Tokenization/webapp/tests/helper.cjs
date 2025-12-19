/**
 * Shared helpers for Playwright-like test flows.
 */
const delay = duration => new Promise(resolve => setTimeout(resolve, duration));

const waitForFrontend = () => delay(300);
const waitForBackend = () => delay(800);

const normalizeText = text => text.trim().toLowerCase();

const findButtonByText = async (page, label) => {
  const buttons = await page.$$('button');
  const normalizedLabel = normalizeText(label);
  for (const button of buttons) {
    const text = await button.evaluate(node => node.textContent);
    if (normalizeText(text) === normalizedLabel) {
      return button;
    }
  }
  return null;
};

const confirmDialogSecondaryAction = async page => {
  const dialog = await page.waitForSelector('.MuiDialog-root .MuiStack-root');
  const confirmButton = await dialog.$('.MuiDialogActions-root > button:nth-of-type(2)');
  await confirmButton.click();
};

const readAlertMessage = async page => {
  const alert = await page.waitForSelector('.MuiAlert-message');
  return alert.evaluate(node => node.textContent);
};

module.exports = {
  waitForFrontend,
  waitForBackend,
  confirmDialogSecondaryAction,
  readAlertMessage,
  normalizeText,
  findButtonByText,
};
