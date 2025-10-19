/**
 * Mobile-specific test setup
 * Additional setup for React Native tests
 */

require('@testing-library/jest-native/extend-expect');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setParams: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    canGoBack: jest.fn(() => true),
    isFocused: jest.fn(() => true),
  }),
  useRoute: () => ({
    key: 'test-route',
    name: 'TestScreen',
    params: {},
  }),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }) => children,
}));

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
    Videos: 'Videos',
    All: 'All',
  },
}));

// Mock React Native modules (simplified)
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
  StatusBar: {
    setBarStyle: jest.fn(),
    setBackgroundColor: jest.fn(),
  },
  NativeModules: {
    StatusBarManager: {
      getHeight: jest.fn(() => Promise.resolve(44)),
    },
  },
}));

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: () => ({
    auth: () => ({
      signInWithEmailAndPassword: jest.fn(),
      signOut: jest.fn(),
      currentUser: null,
      onAuthStateChanged: jest.fn(),
    }),
  }),
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  }),
}));

// Mock Google Sign-In
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    isSignedIn: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

// Mock React Native Vector Icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-vector-icons/Feather', () => 'Feather');

// Mock React Native SVG
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  G: 'G',
  Text: 'Text',
}));

// Mock React Native Reanimated (simplified)
jest.mock('react-native-reanimated', () => ({
  default: {
    call: () => {},
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
  },
  useSharedValue: (value) => ({ value }),
  useAnimatedStyle: (style) => style,
  withSpring: (value) => value,
  withTiming: (value) => value,
}));

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
  };
});

// Mock React Native Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock React Native Screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  ScreenContainer: 'ScreenContainer',
  Screen: 'Screen',
}));

// Mock moment.js (fix ES6 import issue)
jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  return actualMoment;
}, { virtual: true });

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn(),
  parseISO: jest.fn(),
  isValid: jest.fn(),
  addDays: jest.fn(),
  subDays: jest.fn(),
  startOfDay: jest.fn(),
  endOfDay: jest.fn(),
}));

// Global test utilities
global.mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
};

global.mockRoute = {
  params: {},
};

// Mock expo-secure-store (fix ES6 import issue)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}), { virtual: true });

// Mock expo-font (fix ES6 import issue)
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}), { virtual: true });

// Mock expo-notifications (fix ES6 import issue)
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}), { virtual: true });

// Mock NetInfo (fix native module issue)
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  getCurrentConnectivity: jest.fn(() => Promise.resolve({ isConnected: true })),
}), { virtual: true });

// Mock React Native StyleSheet (simplified)
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
  StatusBar: {
    setBarStyle: jest.fn(),
    setBackgroundColor: jest.fn(),
  },
  NativeModules: {
    StatusBarManager: {
      getHeight: jest.fn(() => Promise.resolve(44)),
    },
  },
  StyleSheet: {
    create: jest.fn((styles) => styles),
  },
}));

// Mock lz-string (fix missing module issue)
jest.mock('lz-string', () => ({
  compress: jest.fn((str) => `compressed_${str}`),
  decompress: jest.fn((str) => str.replace('compressed_', '')),
}), { virtual: true });

// Set test environment variables for GCP production
process.env.NODE_ENV = 'test';
process.env.EXPO_PUBLIC_API_URL = 'https://flow-api-891963913698.us-central1.run.app';
process.env.EXPO_PUBLIC_ENVIRONMENT = 'production';

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
