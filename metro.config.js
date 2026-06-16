const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const jsoMetroPlugin = require("obfuscator-io-metro-plugin")(
    {
      compact: false,
      sourceMap: false,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 1,
      numbersToExpressions: true,
      simplify: true,
      stringArrayShuffle: true,
      splitStrings: true,
      stringArrayThreshold: 1,
    },
    {
      runInDev: false,
      logObfuscatedFiles: true,
    }
  );

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    blockList: [/\.claude\/worktrees\/.*/],
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'mjs','json', 'cjx'],
    extraNodeModules: {
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('react-native-crypto'),
      '@noble/hashes': require.resolve('@noble/hashes'),
      stream: require.resolve("stream-browserify"),
      events: require.resolve("events/"),
      http: require.resolve('@tradle/react-native-http'),
      'cross-fetch': require.resolve('./src/shims/cross-fetch.js'),
    },
  },
};

// Merge with default config and obfuscator plugin
module.exports = mergeConfig(getDefaultConfig(__dirname), config);
// module.exports = { ...module.exports, ...jsoMetroPlugin }; // Obfuscator plugin usually wraps the whole export or merges