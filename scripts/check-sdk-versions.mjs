/**
 * Are the Expo packages actually the ones this SDK ships with?
 *
 * This exists because a single wrong version cost a full CI cycle and would
 * have cost the first person who pressed "Run workflow" twenty minutes for
 * nothing: `expo-linking` sat at 56.0.14 — an SDK 56 package — in an SDK 52
 * project. Nothing imported it and nothing depended on it, but it was still
 * autolinked, and its build.gradle asked for a Gradle plugin that does not
 * exist before SDK 53. The web bundle never noticed; the native build could
 * never have succeeded.
 *
 * `expo` ships the list of versions it expects, so the check needs no network
 * and no Expo account, and runs in well under a second — before Gradle, not
 * after it.
 *
 *   node scripts/check-sdk-versions.mjs
 */
import { createRequire } from 'node:module';

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

if (problems.length) {
  console.error(`Expo packages do not match SDK ${sdk}:\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    '\nFix with `npx expo install --fix`, or remove the package if nothing imports it.\n' +
      'A mismatch here breaks the native build even when the web bundle is fine.',
  );
  process.exit(1);
}

console.log(`Expo packages match SDK ${sdk}.`);
