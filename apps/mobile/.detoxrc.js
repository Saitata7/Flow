/**
 * Detox Configuration
 * End-to-end testing configuration for React Native
 */

module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'detox.config.js',
    },
    jest: {
      setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.js'],
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Flow.app',
      build: 'xcodebuild -workspace ios/Flow.xcworkspace -scheme Flow -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Flow.app',
      build: 'xcodebuild -workspace ios/Flow.xcworkspace -scheme Flow -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: {
        '8081': '8081',
      },
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15',
      },
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_34',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug',
    },
    'android.att.release': {
      device: 'attached',
      app: 'android.release',
    },
  },
  artifacts: {
    rootDir: './artifacts',
    pathBuilder: './artifacts/path-builder.js',
    plugins: {
      log: { enabled: true },
      screenshot: { enabled: true },
      video: { enabled: true },
      instruments: { enabled: false },
      network: { enabled: true },
    },
  },
  behavior: {
    init: {
      exposeGlobals: false,
    },
    cleanup: {
      shutdownDevice: false,
    },
  },
  logger: {
    level: 'info',
  },
};
