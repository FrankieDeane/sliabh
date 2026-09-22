/**
 * Are the installed packages ones this project can actually build natively?
 *
 * This exists because a single wrong version cost a full CI cycle and would
 * have cost the first person who pressed "Run workflow" twenty minutes for
 * nothing: `expo-linking` sat at 56.0.14 — an SDK 56 package — in an SDK 52
 * project. Nothing imported it and nothing depended on it, but it was still
 * autolinked, and its build.gradle asked for a Gradle plugin that does not
 * exist before SDK 53. The web bundle never noticed; the native build could
 * never have succeeded.
 *
 * The second half is the same bug in general form. `.npmrc` sets
 * `legacy-peer-deps=true`, so npm installs a package whose peer range says
 * "React Native >= 0.80" into a React Native 0.76 project and says nothing at
 * all. `@maplibre/maplibre-react-native` was doing exactly that — unimported,
 * unused, the native map being a WebView — and it still broke the build, in
 * codegen this time, because autolinking does not care whether anyone imports
 * a native module.
 *
 * `expo` ships the list of versions it expects, and every package states its
 * own peers, so the check needs no network and no Expo account, and runs in
 * well under a second — before Gradle, not after it.
 *
 *   node scripts/check-sdk-versions.mjs
 */
import { createRequire } from 'node:module';
import semver from 'semver';

const require = createRequire(import.meta.url);
const expected = require('../node_modules/expo/bundledNativeModules.json');
const { dependencies = {}, devDependencies = {} } = require('../package.json');
const declared = { ...dependencies, ...devDependencies };
const sdk = require('../node_modules/expo/package.json').version.split('.')[0];

/** The major is what decides ABI and Gradle plugin compatibility. */
const major = (range) => (String(range).match(/(\d+)/) || [])[1];

const problems = [];
for (const [name, want] of Object.entries(expected)) {
  if (!declared[name]) continue;
  let installed;
  try {
    installed = require(`../node_modules/${name}/package.json`).version;
  } catch {
    problems.push(`${name}: declared as ${declared[name]} but not installed`);
    continue;
  }
  if (major(want) !== major(installed)) {
    problems.push(
      `${name}: installed ${installed} (declared ${declared[name]}), SDK ${sdk} expects ${want}`,
    );
  }
}

/**
 * The three packages whose version decides whether a native module compiles:
 * a mismatch here is a build failure, not a warning.
 */
const CORE = ['react-native', 'react', 'expo'];
const coreVersion = {};
for (const name of CORE) {
  try {
    coreVersion[name] = require(`../node_modules/${name}/package.json`).version;
  } catch {
    // not installed; nothing to check against
  }
}

for (const name of Object.keys(declared)) {
  if (CORE.includes(name)) continue;
  let peers;
  try {
    peers = require(`../node_modules/${name}/package.json`).peerDependencies;
  } catch {
    continue;
  }
  if (!peers) continue;
  for (const core of CORE) {
    const range = peers[core];
    const have = coreVersion[core];
    if (!range || !have) continue;
    // `satisfies` alone rejects too much: plenty of packages publish ranges
    // that exclude a perfectly working patch release. Only a version *below*
    // the stated minimum is the failure this is looking for.
    const min = semver.minVersion(range, { loose: true });
    if (min && semver.lt(have, min)) {
      problems.push(
        `${name}@${require(`../node_modules/${name}/package.json`).version}: needs ${core} ${range}, this project has ${have}`,
      );
    }
  }
}

if (problems.length) {
  console.error(`Packages that cannot build against this project:\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    '\nInstall the version this SDK expects (`npx expo install --fix`), or remove\n' +
      'the package if nothing imports it. Either way it must be resolved: the web\n' +
      'bundle is happy with all of these, and the native build cannot be.\n' +
      '\n.npmrc sets legacy-peer-deps=true, so npm will not warn about any of it.',
  );
  process.exit(1);
}

console.log(`Packages match Expo SDK ${sdk} / React Native ${coreVersion['react-native']}.`);
