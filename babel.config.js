module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@": "./", // adjust this path if needed, e.g., "./src" if your files are under a src folder
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
