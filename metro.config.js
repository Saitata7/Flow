const { getDefaultConfig } = require('expo/metro-config');

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

module.exports = config;