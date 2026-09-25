// Loads a plain TypeScript module (and the relative .ts modules it imports)
// straight into Node, no bundler: each file's TS syntax is stripped with
// typescript.transpileModule and run as CommonJS. Only for data/utility
// modules with relative imports and no React Native at module scope —
// src/data/*, src/utils/trailSeo.ts, src/utils/trailFaq.ts.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createRequire } from 'node:module';

const cache = new Map();
const nodeRequire = createRequire(import.meta.url);

export function loadTs(relOrAbsPath) {
  const abs = path.resolve(relOrAbsPath);
  if (cache.has(abs)) return cache.get(abs).exports;
  const source = fs.readFileSync(abs, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  const mod = { exports: {} };
  cache.set(abs, mod);
  const localRequire = (spec) => {
    if (spec.startsWith('.')) {
      const base = path.resolve(path.dirname(abs), spec);
      for (const cand of [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
        if (fs.existsSync(cand)) return loadTs(cand);
      }
    }
    return nodeRequire(spec);
  };
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
    mod.exports, localRequire, mod, abs, path.dirname(abs),
  );
  return mod.exports;
}
