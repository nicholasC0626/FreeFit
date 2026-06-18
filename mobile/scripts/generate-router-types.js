#!/usr/bin/env node
// Generates .expo/types/router.d.ts for expo-router typed routes (app.json
// experiments.typedRoutes). The dev server (`expo start`) writes this file on
// the fly, but a clean checkout (CI) has no dev server, so `tsc --noEmit` fails
// because tsconfig includes .expo/types/**. This reproduces the CLI's own typegen
// headlessly. See .github/workflows/ci.yml (typecheck-mobile).
const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(__dirname, '..', 'app');
const outDir = path.resolve(__dirname, '..', '.expo', 'types');

const requireContext = require('expo-router/build/testing-library/require-context-ponyfill').default;
const { EXPO_ROUTER_CTX_IGNORE } = require('expo-router/_ctx-shared');
const { getTypedRoutesDeclarationFile } = require('expo-router/build/typed-routes/generate');

const ctx = requireContext(appRoot, true, EXPO_ROUTER_CTX_IGNORE);
const file = getTypedRoutesDeclarationFile(ctx);
if (!file) {
  console.error('Failed to generate typed routes declaration file.');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'router.d.ts'), file);
console.log(`Wrote ${path.relative(process.cwd(), path.join(outDir, 'router.d.ts'))}`);
