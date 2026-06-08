const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// Supabase JS v2+ dynamically imports @opentelemetry/api which Metro can't resolve.
// Stub it out with an empty module.
const emptyModule = path.resolve(__dirname, 'src/stubs/empty.js');
if (!fs.existsSync(path.dirname(emptyModule))) {
  fs.mkdirSync(path.dirname(emptyModule), { recursive: true });
}
if (!fs.existsSync(emptyModule)) {
  fs.writeFileSync(emptyModule, 'module.exports = {};');
}

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
    '@opentelemetry/api': emptyModule,
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
