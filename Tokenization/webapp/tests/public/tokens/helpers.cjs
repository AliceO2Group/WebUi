const {
    waitForBackend,
    waitForFrontend,
    findButtonByText,
    confirmDialogSecondaryAction,
} = require('../../helper.cjs');

async function tryRevokeSingleToken(page, tokenId) {
    let tokenRow;
    await waitForBackend();

    const trs = await page.$$('table tbody tr');
    for (const tr of trs) {
        const td = await tr.$('td:first-child a');
        const text = await td.evaluate(node => node.textContent);
        if (text.trim() === tokenId) {
            tokenRow = tr;
            break;
        }
    }
    if (!tokenRow) throw new Error('Token row not found');

    const revokeButton = await tokenRow.$('button');
    await revokeButton.click();
    await confirmDialogSecondaryAction(page);    
}

async function tryBulkRevokeTokens(page, issuedAfter) {
    await waitForFrontend();
    
    const showFiltersButton = await findButtonByText(page, 'show');
    if (!showFiltersButton) throw new Error('Show Filters button not found');
    await showFiltersButton.click();
    await waitForFrontend();

    const issueAfterInput = await page.waitForSelector('input[name="issuedAfter"]');
    await issueAfterInput.type(issuedAfter);

    const applyFiltersButton = await findButtonByText(page, 'apply');
    if (!applyFiltersButton) throw new Error('Apply Filters button not found');
    await applyFiltersButton.click();
    await waitForBackend();

    const revokeBulkButton = await findButtonByText(page, 'bulk revoke');
    if (!revokeBulkButton) throw new Error('Bulk Revoke button not found');
    await revokeBulkButton.click();

    await confirmDialogSecondaryAction(page);
}

module.exports = {
    tryRevokeSingleToken,
    tryBulkRevokeTokens,
}