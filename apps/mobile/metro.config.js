const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Raíz del monorepo
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Ver todas las carpetas del monorepo (packages y apps)
config.watchFolders = [workspaceRoot];

// 2. Forzar resolución de dependencias core a la raíz (Deduplicación)
// Esto evita el error "Invalid hook call" al asegurar que solo exista un React.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  'react': path.resolve(workspaceRoot, 'node_modules/react'),
  'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
  'expo': path.resolve(workspaceRoot, 'node_modules/expo'),
};

// 3. Priorizar extensiones nativas
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

module.exports = config;
