const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Allow TypeScript files for dependencies (like expo)
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add path mapping support
config.resolver.alias = {
  '@': './src',
  '@styles': './styles',
  '@components': './src/components',
  '@screens': './src/screens',
  '@utils': './src/utils',
  '@hooks': './src/hooks',
  '@context': './src/context',
};

// Watch additional folders for monorepo support
config.watchFolders = [
  projectRoot,
  monorepoRoot,
];

// Resolve packages from monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Ensure proper resolution of expo and other packages
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;