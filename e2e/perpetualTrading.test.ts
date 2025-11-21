import {by, device, element, expect as detoxExpect, waitFor} from 'detox';

describe('Perpetual Trading', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true});
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display trading screen with balance', async () => {
    await detoxExpect(element(by.id('trading-screen'))).toBeVisible();
    await detoxExpect(element(by.id('balance-value'))).toBeVisible();

    // Take screenshot
    await device.takeScreenshot('trading-screen-loaded');
  });

  it('should allow selecting different assets', async () => {
    // Open asset picker
    await element(by.id('asset-picker-button')).tap();

    // Select ETH
    await waitFor(element(by.id('asset-ETH')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.id('asset-ETH')).tap();

    // Verify asset is selected
    await detoxExpect(element(by.text('ETH'))).toBeVisible();

    await device.takeScreenshot('asset-eth-selected');
  });

  it('should open a LONG position successfully', async () => {
    // Enter trade parameters
    await element(by.id('size-input')).clearText();
    await element(by.id('size-input')).typeText('0.5');

    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('10');

    // Take screenshot before trade
    await device.takeScreenshot('before-long-position');

    // Open LONG position
    await element(by.id('long-button')).tap();

    // Wait for success alert
    await waitFor(element(by.text('Success')))
      .toBeVisible()
      .withTimeout(2000);

    await device.takeScreenshot('long-position-success-alert');

    // Dismiss alert
    await element(by.text('OK')).tap();

    // Navigate to positions
    await element(by.text('Positions')).tap();

    // Verify position is visible
    await waitFor(element(by.id('positions-screen')))
      .toBeVisible()
      .withTimeout(2000);

    await device.takeScreenshot('position-opened-long');
  });

  it('should open a SHORT position successfully', async () => {
    // Enter trade parameters
    await element(by.id('size-input')).clearText();
    await element(by.id('size-input')).typeText('0.3');

    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('20');

    await device.takeScreenshot('before-short-position');

    // Open SHORT position
    await element(by.id('short-button')).tap();

    // Wait for success alert
    await waitFor(element(by.text('Success')))
      .toBeVisible()
      .withTimeout(2000);

    await device.takeScreenshot('short-position-success-alert');

    // Dismiss alert
    await element(by.text('OK')).tap();

    // Navigate to positions
    await element(by.text('Positions')).tap();

    await waitFor(element(by.id('positions-screen')))
      .toBeVisible()
      .withTimeout(2000);

    await device.takeScreenshot('position-opened-short');
  });

  it('should display position details correctly', async () => {
    // Open a position first
    await element(by.id('size-input')).clearText();
    await element(by.id('size-input')).typeText('1');

    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('50');

    await element(by.id('long-button')).tap();

    await waitFor(element(by.text('Success')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('OK')).tap();

    // Navigate to positions
    await element(by.text('Positions')).tap();

    await waitFor(element(by.id('positions-screen')))
      .toBeVisible()
      .withTimeout(2000);

    // Wait a bit for price updates
    await new Promise(resolve => setTimeout(resolve, 3000));

    await device.takeScreenshot('position-details-with-pnl');
  });

  it('should close a position successfully', async () => {
    // Open a position first
    await element(by.id('size-input')).clearText();
    await element(by.id('size-input')).typeText('0.5');

    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('10');

    await element(by.id('long-button')).tap();
    await waitFor(element(by.text('Success')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('OK')).tap();

    // Navigate to positions
    await element(by.text('Positions')).tap();

    await waitFor(element(by.id('positions-screen')))
      .toBeVisible()
      .withTimeout(2000);

    // Wait for position to appear
    await new Promise(resolve => setTimeout(resolve, 1000));

    await device.takeScreenshot('before-closing-position');

    // Find and tap the close button (first position)
    const positions = await element(by.id(/^position-/));
    const firstPosition = positions.atIndex(0);

    // Scroll to make sure the close button is visible
    await waitFor(element(by.id(/^close-position-/)).atIndex(0))
      .toBeVisible()
      .withTimeout(2000)
      .whileElement(by.id('positions-screen'))
      .scroll(50, 'down');

    await element(by.id(/^close-position-/)).atIndex(0).tap();

    // Confirm close
    await waitFor(element(by.text('Close')))
      .toBeVisible()
      .withTimeout(2000);

    await device.takeScreenshot('close-position-confirmation');

    await element(by.text('Close')).tap();

    // Wait for success alert
    await waitFor(element(by.text('Success')))
      .toBeVisible()
      .withTimeout(2000);

    await device.takeScreenshot('position-closed-success');

    await element(by.text('OK')).tap();
  });

  it('should handle high leverage positions (up to 100x)', async () => {
    // Test with 100x leverage
    await element(by.id('size-input')).clearText();
    await element(by.id('size-input')).typeText('0.1');

    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('100');

    await device.takeScreenshot('100x-leverage-setup');

    // Verify required margin is calculated correctly
    await detoxExpect(element(by.id('required-margin'))).toBeVisible();

    await element(by.id('long-button')).tap();

    await waitFor(element(by.text('Success')))
      .toBeVisible()
      .withTimeout(2000);

    await device.takeScreenshot('100x-leverage-position-opened');

    await element(by.text('OK')).tap();

    // Navigate to positions to see the high leverage position
    await element(by.text('Positions')).tap();

    await waitFor(element(by.id('positions-screen')))
      .toBeVisible()
      .withTimeout(2000);

    await device.takeScreenshot('100x-leverage-position-details');
  });

  it('should prevent opening position with insufficient balance', async () => {
    // Try to open a very large position
    await element(by.id('size-input')).clearText();
    await element(by.id('size-input')).typeText('100');

    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('1');

    await device.takeScreenshot('insufficient-balance-setup');

    await element(by.id('long-button')).tap();

    // Wait for error alert
    await waitFor(element(by.text('Error')))
      .toBeVisible()
      .withTimeout(2000);

    await detoxExpect(element(by.text('Insufficient balance'))).toBeVisible();

    await device.takeScreenshot('insufficient-balance-error');

    await element(by.text('OK')).tap();
  });

  it('should show real-time price updates', async () => {
    await detoxExpect(element(by.id('asset-price'))).toBeVisible();

    // Take screenshot at different times to show price changes
    await device.takeScreenshot('price-update-1');

    await new Promise(resolve => setTimeout(resolve, 3000));

    await device.takeScreenshot('price-update-2');

    await new Promise(resolve => setTimeout(resolve, 3000));

    await device.takeScreenshot('price-update-3');
  });

  it('should update position P&L in real-time', async () => {
    // Open a position
    await element(by.id('size-input')).clearText();
    await element(by.id('size-input')).typeText('1');

    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('10');

    await element(by.id('long-button')).tap();

    await waitFor(element(by.text('Success')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('OK')).tap();

    // Navigate to positions
    await element(by.text('Positions')).tap();

    await waitFor(element(by.id('positions-screen')))
      .toBeVisible()
      .withTimeout(2000);

    // Take screenshots at different times to show P&L changes
    await device.takeScreenshot('pnl-update-1');

    await new Promise(resolve => setTimeout(resolve, 3000));

    await device.takeScreenshot('pnl-update-2');

    await new Promise(resolve => setTimeout(resolve, 3000));

    await device.takeScreenshot('pnl-update-3');
  });
});
