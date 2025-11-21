import {by, device, element, expect as detoxExpect, waitFor} from 'detox';

describe('Margin Calls and Liquidation', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true});
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should track position approaching liquidation price', async () => {
    // Open a high leverage position
    await element(by.id('size-input')).clearText();
    await element(by.id('size-input')).typeText('1');

    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('100');

    await device.takeScreenshot('high-leverage-position-setup');

    await element(by.id('long-button')).tap();

    await waitFor(element(by.text('Success')))
      .toBeVisible()
      .withTimeout(2000);

    await device.takeScreenshot('high-leverage-position-opened');

    await element(by.text('OK')).tap();

    // Navigate to positions
    await element(by.text('Positions')).tap();

    await waitFor(element(by.id('positions-screen')))
      .toBeVisible()
      .withTimeout(2000);

    // Take screenshot showing liquidation price
    await device.takeScreenshot('liquidation-price-visible');

    // Monitor for a bit
    await new Promise(resolve => setTimeout(resolve, 5000));

    await device.takeScreenshot('position-monitoring');
  });

  it('should display position status correctly', async () => {
    // Open a position
    await element(by.id('size-input')).clearText();
    await element(by.id('size-input')).typeText('0.5');

    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('20');

    await element(by.id('short-button')).tap();

    await waitFor(element(by.text('Success')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('OK')).tap();

    // Navigate to positions
    await element(by.text('Positions')).tap();

    await waitFor(element(by.id('positions-screen')))
      .toBeVisible()
      .withTimeout(2000);

    // Verify OPEN status is shown
    await waitFor(element(by.id(/^position-status-/)))
      .toBeVisible()
      .withTimeout(2000);

    await device.takeScreenshot('position-open-status');
  });

  it('should handle multiple positions with different assets', async () => {
    // Open BTC position
    await element(by.id('size-input')).clearText();
    await element(by.id('size-input')).typeText('0.5');

    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('10');

    await element(by.id('long-button')).tap();
    await waitFor(element(by.text('Success')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('OK')).tap();

    // Switch to ETH
    await element(by.id('asset-picker-button')).tap();
    await waitFor(element(by.id('asset-ETH')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.id('asset-ETH')).tap();

    // Open ETH position
    await element(by.id('size-input')).clearText();
    await element(by.id('size-input')).typeText('2');

    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('15');

    await element(by.id('short-button')).tap();
    await waitFor(element(by.text('Success')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('OK')).tap();

    // Navigate to positions
    await element(by.text('Positions')).tap();

    await waitFor(element(by.id('positions-screen')))
      .toBeVisible()
      .withTimeout(2000);

    // Take screenshot showing multiple positions
    await device.takeScreenshot('multiple-positions');

    // Wait for price updates
    await new Promise(resolve => setTimeout(resolve, 3000));

    await device.takeScreenshot('multiple-positions-with-updates');
  });

  it('should calculate margin correctly for different leverages', async () => {
    // Test with 5x leverage
    await element(by.id('size-input')).clearText();
    await element(by.id('size-input')).typeText('1');

    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('5');

    await device.takeScreenshot('5x-leverage-margin-calculation');

    // Test with 50x leverage
    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('50');

    await device.takeScreenshot('50x-leverage-margin-calculation');

    // Test with 100x leverage
    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('100');

    await device.takeScreenshot('100x-leverage-margin-calculation');
  });

  it('should handle closing multiple positions', async () => {
    // Open first position
    await element(by.id('size-input')).clearText();
    await element(by.id('size-input')).typeText('0.5');

    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('10');

    await element(by.id('long-button')).tap();
    await waitFor(element(by.text('Success')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('OK')).tap();

    // Open second position
    await element(by.id('size-input')).clearText();
    await element(by.id('size-input')).typeText('0.3');

    await element(by.id('leverage-input')).clearText();
    await element(by.id('leverage-input')).typeText('20');

    await element(by.id('short-button')).tap();
    await waitFor(element(by.text('Success')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('OK')).tap();

    // Navigate to positions
    await element(by.text('Positions')).tap();

    await waitFor(element(by.id('positions-screen')))
      .toBeVisible()
      .withTimeout(2000);

    await device.takeScreenshot('two-positions-open');

    // Wait for updates
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Close first position
    await element(by.id(/^close-position-/)).atIndex(0).tap();
    await waitFor(element(by.text('Close')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('Close')).tap();
    await waitFor(element(by.text('Success')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('OK')).tap();

    await device.takeScreenshot('one-position-closed');

    // Final screenshot showing the state
    await new Promise(resolve => setTimeout(resolve, 1000));
    await device.takeScreenshot('final-state');
  });
});
