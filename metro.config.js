const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const { resolver, transformer } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: resolver.sourceExts.includes("svg")
    ? resolver.sourceExts
    : [...resolver.sourceExts, "svg"],
};

module.exports = withNativewind(config, {
  input: "./global.css",
});
