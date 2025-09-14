const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

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
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

config.watchFolders = [
  projectRoot,
  monorepoRoot,
];

// Resolve packages from monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;