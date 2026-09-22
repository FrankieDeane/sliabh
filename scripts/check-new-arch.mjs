/**
 * Does any native module need the New Architecture the project has turned off?
 *
 * react-native-mmkv 3 does. Its Android code extends
 * `NativeMmkvPlatformContextSpec`, a class React Native's codegen only
 * generates when the New Architecture is on, and it ships no old-architecture
 * source set to fall back to. With `newArchEnabled=false` the class simply
 * does not exist, and the build fails four minutes in with eight "cannot find
 * symbol" errors that name a file nobody wrote.
 *
 * Nothing declarative says so: its peer range is `react-native: *`, which is
 * how it passed every version check. What can be read is the code — a module
 * that references a generated spec and has no `oldarch` (or `paper`) sources
 * can only compile with the New Architecture on.
 *
 * Run after `expo prebuild`, which is what writes the flag.
 *
 *   node scripts/check-new-arch.mjs
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PROPS = 'android/gradle.properties';
if (!existsSync(PROPS)) {
  console.error(`${PROPS} not found — run \`npx expo prebuild -p android\` first.`);
  process.exit(1);
}

const newArch = /^newArchEnabled\s*=\s*true/m.test(readFileSync(PROPS, 'utf8'));
if (newArch) {
  console.log('New Architecture is on; every module may use generated specs.');
  process.exit(0);
}

/** `extends NativeFooSpec` in Java, `: NativeFooSpec` in Kotlin. */
const SPEC = /(?:extends|:)\s*Native[A-Za-z0-9_]+Spec\b/;

function referencesSpec(dir) {
  let found = false;
  const walk = (d) => {
    if (found) return;
    let entries;
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (found) return;
      const full = join(d, entry);
      let info;
      try {
        info = statSync(full);
      } catch {
        continue;
      }
      if (info.isDirectory()) walk(full);
      else if (/\.(java|kt)$/.test(entry)) {
        try {
          if (SPEC.test(readFileSync(full, 'utf8'))) found = true;
        } catch {
          // unreadable file; nothing to assert either way
        }
      }
    }
  };
  walk(dir);
  return found;
}

function packages() {
  const out = [];
  for (const entry of readdirSync('node_modules')) {
    if (entry.startsWith('.')) continue;
    if (entry.startsWith('@')) {
      for (const scoped of readdirSync(join('node_modules', entry))) {
        out.push(`${entry}/${scoped}`);
      }
    } else out.push(entry);
  }
  return out;
}

const offenders = [];
for (const name of packages()) {
  const android = join('node_modules', name, 'android');
  const main = join(android, 'src', 'main');
  if (!existsSync(main)) continue;
  if (!referencesSpec(main)) continue;
  // A module shipping both source sets compiles either way; only one with
  // nothing but generated specs is a problem.
  if (existsSync(join(android, 'src', 'oldarch')) || existsSync(join(android, 'src', 'paper'))) continue;
  let version = '';
  try {
    version = JSON.parse(readFileSync(join('node_modules', name, 'package.json'), 'utf8')).version;
  } catch {
    // version is a nicety here, not the finding
  }
  offenders.push(`${name}${version ? `@${version}` : ''}`);
}

if (offenders.length) {
  console.error('These modules need the New Architecture, which is off in gradle.properties:\n');
  for (const o of offenders) console.error(`  ${o}`);
  console.error(
    '\nUse a version that still ships old-architecture sources, or turn the New\n' +
      'Architecture on deliberately — every other native module has to support it too.',
  );
  process.exit(1);
}

console.log('No module requires the New Architecture.');
