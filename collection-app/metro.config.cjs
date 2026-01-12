const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 1. Watch the shared folder outside of collection-app
const sharedFolderPath = path.resolve(__dirname, '../shared');
config.watchFolders = [sharedFolderPath];

// 2. Allow Metro to resolve modules from the shared folder
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(sharedFolderPath, 'node_modules'),
];

module.exports = config;