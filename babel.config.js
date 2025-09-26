module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-reanimated/plugin', // should be the last plugin
  ],
  plugins: [
    ...(process.env.NODE_ENV !== 'production'
      ? [
          [
            'transform-remove-console',
            {
              exclude: ['error', 'warn'],
            },
          ],
        ]
      : []),
  ],
};
