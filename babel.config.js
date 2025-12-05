module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['module:metro-react-native-babel-preset'],

    // 🔥 GLOBAL IGNORE (prevents ALL plugins from touching shim.js)
    ignore: [
      "**/shim.js",
    ],

    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          safe: false,
          allowUndefined: true,
        },
      ],

      // Remove console.* only in production
      ...(process.env.NODE_ENV === "production"
        ? [
            [
              "transform-remove-console",
              {
                exclude: ["error", "warn", "log"],
              },
            ],
          ]
        : []),
    ],
  };
};
