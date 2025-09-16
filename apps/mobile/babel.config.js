module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@styles': './styles',
            '@components': './src/components',
            '@screens': './src/screens',
            '@utils': './src/utils',
            '@hooks': './src/hooks',
            '@context': './src/context',
          },
        },
      ],
    ],
    // Allow TypeScript processing for dependencies
    overrides: [
      {
        test: /node_modules\/expo\/.*\.(ts|tsx)$/,
        presets: ['babel-preset-expo'],
      },
    ],
  };
};
