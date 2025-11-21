import {device} from 'detox';

beforeAll(async () => {
  await device.launchApp({
    permissions: {notifications: 'YES'},
  });
});

beforeEach(async () => {
  await device.reloadReactNative();
});
