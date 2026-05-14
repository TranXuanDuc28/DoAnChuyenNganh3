const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Thêm định dạng tflite vào danh sách các file asset được phép
config.resolver.assetExts.push('tflite');

module.exports = config;
