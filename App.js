// Root App.js - Entry point for Expo
import registerRootComponent from 'expo/src/launch/registerRootComponent';
import App from './apps/mobile/src/App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

